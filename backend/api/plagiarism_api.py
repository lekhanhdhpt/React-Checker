"""
Flask API Server for Plagiarism Detection
Load pre-trained models and expose REST API endpoints
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import numpy as np
import pickle
import os
import re
import time
from pathlib import Path
from sentence_transformers import SentenceTransformer
import faiss

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# ===============================================
# LOAD PRE-TRAINED MODELS AND DATA
# ===============================================
print("="*60)
print("🚀 LOADING PRE-TRAINED MODELS...")
print("="*60)

# Resolve data directory relative to this file
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / 'data'

# Load corpus data
with open(DATA_DIR / 'vn_plagiarism_corpus.json', 'r', encoding='utf-8') as f:
    corpus_data = json.load(f)
print(f"✅ Loaded corpus: {len(corpus_data)} documents")

# Load queries data (for metadata)
with open(DATA_DIR / 'vn_plagiarism_queries.json', 'r', encoding='utf-8') as f:
    queries_data = json.load(f)
print(f"✅ Loaded queries: {len(queries_data)} queries")

# Load bi-encoder model
model_name = "bkai-foundation-models/vietnamese-bi-encoder"
bi_encoder = SentenceTransformer(model_name)
print(f"✅ Loaded bi-encoder model: {model_name}")

# Load corpus chunks
with open(DATA_DIR / 'corpus_chunks.pkl', 'rb') as f:
    corpus_chunks = pickle.load(f)
print(f"✅ Loaded corpus chunks: {len(corpus_chunks)} chunks")

# Load embeddings
chunk_embeddings_normalized = np.load(DATA_DIR / 'chunk_embeddings_normalized.npy')
print(f"✅ Loaded embeddings: {chunk_embeddings_normalized.shape}")

# Load FAISS index
chunk_faiss_index = faiss.read_index(str(DATA_DIR / 'chunk_faiss_index.faiss'))
print(f"✅ Loaded FAISS index: {chunk_faiss_index.ntotal} vectors")

# Load chunk metadata
with open(DATA_DIR / 'chunk_metadata.pkl', 'rb') as f:
    metadata = pickle.load(f)
chunk_ids = metadata['chunk_ids']
print(f"✅ Loaded metadata: {len(chunk_ids)} chunk IDs")

# Create chunk map for fast lookup
chunk_map = {chunk['chunk_id']: chunk for chunk in corpus_chunks}
doc_chunks_map = {}
for chunk in corpus_chunks:
    doc_chunks_map.setdefault(chunk['doc_id'], []).append(chunk)

# Create doc metadata map
doc_metadata_map = {doc['id']: doc for doc in corpus_data}

print("="*60)
print("✅ ALL MODELS LOADED SUCCESSFULLY!")
print("="*60)
# ===============================================
# INITIALIZE AI DETECTION TOKENIZER (GLOBAL)
# ===============================================
try:
    from transformers import AutoTokenizer
    tokenizer = AutoTokenizer.from_pretrained('vinai/phobert-base', use_fast=True)
    print("AI tokenizer initialized")
except Exception as e:
    print(f"Warning: Could not initialize AI tokenizer: {e}")
    tokenizer = None
# ===============================================
# UTILITY CLASSES (From Notebook)
# ===============================================

class TextChunker:
    def __init__(self, chunk_type="adaptive", max_chunk_words=100):
        self.chunk_type = chunk_type
        self.max_chunk_words = max_chunk_words
    
    def chunk_text(self, text, doc_id):
        word_count = len(text.split())
        if self.chunk_type == "adaptive":
            if word_count > 500:
                return self._chunk_by_paragraph(text, doc_id)
            else:
                return self._chunk_by_sentence(text, doc_id)
        elif self.chunk_type == "paragraph":
            return self._chunk_by_paragraph(text, doc_id)
        else:
            return self._chunk_by_sentence(text, doc_id)
    
    def _chunk_by_sentence(self, text, doc_id):
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        chunks = []
        for i, sentence in enumerate(sentences):
            chunk = {
                'chunk_id': f"{doc_id}_chunk_{i}",
                'doc_id': doc_id,
                'text': sentence,
                'position': i,
                'length': len(sentence.split())
            }
            chunks.append(chunk)
        return chunks
    
    def _chunk_by_paragraph(self, text, doc_id):
        paragraphs = re.split(r'\n\n+|\s{4,}', text)
        paragraphs = [p.strip() for p in paragraphs if p.strip()]
        chunks = []
        current_chunk = []
        current_length = 0
        
        for para in paragraphs:
            para_words = para.split()
            para_length = len(para_words)
            
            if para_length > self.max_chunk_words:
                if current_chunk:
                    chunks.append(' '.join(current_chunk))
                    current_chunk = []
                    current_length = 0
                sentences = re.split(r'[.!?]+', para)
                sentences = [s.strip() for s in sentences if s.strip()]
                temp_chunk = []
                temp_length = 0
                for sent in sentences:
                    sent_len = len(sent.split())
                    if temp_length + sent_len > self.max_chunk_words and temp_chunk:
                        chunks.append(' '.join(temp_chunk))
                        temp_chunk = [sent]
                        temp_length = sent_len
                    else:
                        temp_chunk.append(sent)
                        temp_length += sent_len
                if temp_chunk:
                    chunks.append(' '.join(temp_chunk))
            elif current_length + para_length <= self.max_chunk_words:
                current_chunk.append(para)
                current_length += para_length
            else:
                if current_chunk:
                    chunks.append(' '.join(current_chunk))
                current_chunk = [para]
                current_length = para_length
        
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        chunk_objects = []
        for i, chunk_text in enumerate(chunks):
            chunk_objects.append({
                'chunk_id': f"{doc_id}_chunk_{i}",
                'doc_id': doc_id,
                'text': chunk_text,
                'position': i,
                'length': len(chunk_text.split())
            })
        return chunk_objects


class DocumentScorer:
    def __init__(self, corpus_chunks, weights=None, score_center=0.55, score_scale=4.0):
        self.corpus_chunks = corpus_chunks
        self.weights = weights or {
            'doc_max': 0.40,
            'doc_mean': 0.20,
            'doc_count': 0.15,
            'doc_contiguous': 0.10,
            'doc_coverage': 0.10,
            'chunk_density': 0.05,
            'span_penalty': 0.05
        }
        self.score_center = score_center
        self.score_scale = score_scale
        self.chunk_map = {chunk['chunk_id']: chunk for chunk in corpus_chunks}
        self.doc_chunks_map = {}
        for chunk in corpus_chunks:
            self.doc_chunks_map.setdefault(chunk['doc_id'], []).append(chunk)

    def calculate_doc_scores(self, top_k_results):
        doc_similarities = {}
        for similarity, chunk_idx in top_k_results:
            chunk = self.corpus_chunks[chunk_idx]
            doc_id = chunk['doc_id']
            doc_similarities.setdefault(doc_id, []).append({
                'similarity': similarity,
                'chunk': chunk,
                'chunk_idx': chunk_idx
            })

        doc_scores = []
        for doc_id, chunk_sims in doc_similarities.items():
            similarities = [cs['similarity'] for cs in chunk_sims]
            doc_max = max(similarities)
            doc_mean = np.mean(similarities)
            total_doc_chunks = len(self.doc_chunks_map[doc_id])
            coverage_ratio = min(len(similarities) / total_doc_chunks, 1.0)
            doc_count = coverage_ratio

            positions = sorted(cs['chunk']['position'] for cs in chunk_sims)
            doc_contiguous, max_group_len = self._calculate_contiguous_score(positions)
            span = positions[-1] - positions[0] + 1 if len(positions) > 1 else 1
            span_ratio = min(span / total_doc_chunks, 1.0)
            chunk_density = min(coverage_ratio / max(span_ratio, 1e-6), 1.0)
            chunk_similarity_std = float(np.std(similarities)) if len(similarities) > 1 else 0.0

            raw_score = (
                self.weights['doc_max'] * doc_max +
                self.weights['doc_mean'] * doc_mean +
                self.weights['doc_count'] * doc_count +
                self.weights['doc_contiguous'] * doc_contiguous +
                self.weights['doc_coverage'] * coverage_ratio +
                self.weights['chunk_density'] * chunk_density -
                self.weights['span_penalty'] * (1.0 - span_ratio)
            )

            logistic_input = self.score_scale * (raw_score - self.score_center)
            final_score = 1.0 / (1.0 + np.exp(-logistic_input))

            doc_scores.append({
                'doc_id': doc_id,
                'doc_max': doc_max,
                'doc_mean': doc_mean,
                'doc_count': doc_count,
                'doc_contiguous': doc_contiguous,
                'final_score': final_score,
                'raw_score': raw_score,
                'chunk_similarity_std': chunk_similarity_std,
                'position_span_ratio': span_ratio,
                'chunk_density': chunk_density,
                'contiguous_len': max_group_len,
                'chunks': chunk_sims,
                'num_chunks': len(chunk_sims)
            })

        doc_scores.sort(key=lambda x: x['final_score'], reverse=True)
        return doc_scores

    def _calculate_contiguous_score(self, positions):
        if len(positions) <= 1:
            return 0.0, len(positions)
        contiguous_groups = []
        current_group = [positions[0]]
        for i in range(1, len(positions)):
            if positions[i] - positions[i-1] <= 2:
                current_group.append(positions[i])
            else:
                contiguous_groups.append(len(current_group))
                current_group = [positions[i]]
        contiguous_groups.append(len(current_group))
        max_contiguous = max(contiguous_groups)
        score = min(max_contiguous / len(positions), 1.0)
        return score, max_contiguous


class ContextExpander:
    def __init__(self, corpus_chunks, corpus_data):
        self.corpus_chunks = corpus_chunks
        self.corpus_data = corpus_data
        self.doc_text_map = {doc['id']: doc['text'] for doc in corpus_data}
        self.doc_chunks_map = {}
        for chunk in corpus_chunks:
            doc_id = chunk['doc_id']
            self.doc_chunks_map.setdefault(doc_id, []).append(chunk)
        for doc_id in self.doc_chunks_map:
            self.doc_chunks_map[doc_id].sort(key=lambda x: x['position'])
    
    def expand_chunk_context(self, chunk, context_window=1):
        doc_id = chunk['doc_id']
        position = chunk['position']
        doc_chunks = self.doc_chunks_map[doc_id]
        current_idx = next((idx for idx, c in enumerate(doc_chunks) if c['position'] == position), None)
        if current_idx is None:
            return chunk['text']
        start_idx = max(0, current_idx - context_window)
        end_idx = min(len(doc_chunks), current_idx + context_window + 1)
        context_chunks = doc_chunks[start_idx:end_idx]
        return " ".join([c['text'] for c in context_chunks])
    
    def get_best_chunk_per_doc(self, doc_scores, top_n=15):
        best_chunks = []
        for doc_score in doc_scores[:top_n]:
            sorted_chunks = sorted(doc_score['chunks'], key=lambda x: x['similarity'], reverse=True)
            chunk_data = sorted_chunks[0]
            best_chunks.append({
                'doc_id': doc_score['doc_id'],
                'chunk': chunk_data['chunk'],
                'chunk_similarity': chunk_data['similarity'],
                'doc_final_score': doc_score['final_score'],
                'doc_max': doc_score['doc_max'],
                'doc_mean': doc_score['doc_mean'],
                'doc_count': doc_score['doc_count'],
                'doc_contiguous': doc_score['doc_contiguous']
            })
        return best_chunks


class CompletePlagiarismDetector:
    def __init__(self, bi_encoder, chunk_faiss_index, corpus_chunks, corpus_data,
                 doc_scorer, context_expander, query_chunker=None, 
                 max_query_chunks=10, threshold=0.6):
        self.bi_encoder = bi_encoder
        self.chunk_faiss_index = chunk_faiss_index
        self.corpus_chunks = corpus_chunks
        self.corpus_data = corpus_data
        self.doc_scorer = doc_scorer
        self.context_expander = context_expander
        self.query_chunker = query_chunker or TextChunker()
        self.max_query_chunks = max_query_chunks
        self.threshold = threshold

    def detect(self, query_text, top_k=100, top_n_docs=15, use_faiss=False, verbose=False):
        query_chunks = self.query_chunker.chunk_text(query_text, doc_id="query")
        if self.max_query_chunks and len(query_chunks) > self.max_query_chunks:
            query_chunks = query_chunks[:self.max_query_chunks]
        query_texts = [c['text'] for c in query_chunks]
        word_count = len(query_text.split())

        if len(query_texts) == 0:
            return {
                'prediction': False,
                'confidence': 0.0,
                'threshold': self.threshold,
                'best_match': None,
                'top_results': [],
                'doc_scores': [],
                'method': 'bi-encoder',
                'query_chunks': 0,
                'query_words': word_count,
                'corpus_matches': 0
            }

        q_emb = self.bi_encoder.encode(query_texts, show_progress_bar=False, convert_to_numpy=True)
        q_norms = np.linalg.norm(q_emb, axis=1, keepdims=True)
        q_norms[q_norms < 1e-8] = 1.0
        q_emb_norm = q_emb / q_norms

        similarity_matrix = np.dot(q_emb_norm.astype('float32'), 
                                   chunk_embeddings_normalized.T.astype('float32'))
        if not np.isfinite(similarity_matrix).all():
            similarity_matrix = np.nan_to_num(similarity_matrix, nan=0.0, posinf=1.0, neginf=0.0)
        
        corpus_scores = np.max(similarity_matrix, axis=0)
        top_k_actual = min(top_k, len(corpus_scores))
        top_k_indices = np.argsort(corpus_scores)[::-1][:top_k_actual]
        bi_results = [(float(corpus_scores[idx]), int(idx)) for idx in top_k_indices]

        doc_scores = self.doc_scorer.calculate_doc_scores(bi_results)
        best_chunks = self.context_expander.get_best_chunk_per_doc(doc_scores, top_n=top_n_docs)

        best_doc = doc_scores[0] if len(doc_scores) > 0 else None
        confidence = float(best_doc['final_score']) if best_doc is not None else 0.0
        is_plagiarism = confidence >= self.threshold

        return {
            'prediction': bool(is_plagiarism),
            'confidence': confidence,
            'threshold': self.threshold,
            'best_match': best_doc,
            'top_results': doc_scores[:top_n_docs],
            'doc_scores': doc_scores[:5],
            'method': 'bi-encoder',
            'query_chunks': len(query_chunks),
            'query_words': word_count,
            'corpus_matches': len(bi_results)
        }


# Initialize components
chunker = TextChunker()
doc_scorer = DocumentScorer(corpus_chunks)
context_expander = ContextExpander(corpus_chunks, corpus_data)
complete_detector = CompletePlagiarismDetector(
    bi_encoder=bi_encoder,
    chunk_faiss_index=chunk_faiss_index,
    corpus_chunks=corpus_chunks,
    corpus_data=corpus_data,
    doc_scorer=doc_scorer,
    context_expander=context_expander,
    query_chunker=chunker,
    max_query_chunks=10,
    threshold=0.6
)

print("✅ Plagiarism Detector initialized!")

# ===============================================
# SENTENCE-LEVEL ANALYSIS
# ===============================================

def analyze_sentences(query_text, min_words=6):
    """
    Analyze each sentence in the query text and return plagiarism info
    Returns list of sentences with their plagiarism scores
    """
    sentences = [s.strip() for s in re.split(r"(?<=[.!?…])\s+", query_text) if s.strip()]
    sentence_analysis = []
    
    for idx, sentence in enumerate(sentences):
        word_count = len(sentence.split())
        if word_count < min_words:
            sentence_analysis.append({
                'sentence': sentence,
                'index': idx,
                'word_count': word_count,
                'is_suspicious': False,
                'confidence': 0.0,
                'best_doc_id': None,
                'source_url': None,
                'source_title': None
            })
            continue
        
        # Detect plagiarism for this sentence
        result = complete_detector.detect(sentence, verbose=False)
        best_match = result.get('best_match')
        confidence = result.get('confidence', 0.0)
        
        # Get source metadata
        source_url = None
        source_title = None
        if best_match:
            doc_id = best_match['doc_id']
            if doc_id in doc_metadata_map:
                doc_meta = doc_metadata_map[doc_id]
                source_url = doc_meta.get('source_url') or doc_meta.get('url')
                source_title = doc_meta.get('title')
        
        sentence_analysis.append({
            'sentence': sentence,
            'index': idx,
            'word_count': word_count,
            'is_suspicious': confidence >= 0.5,  # Lower threshold for highlighting
            'confidence': confidence,
            'best_doc_id': best_match['doc_id'] if best_match else None,
            'source_url': source_url,
            'source_title': source_title
        })
    
    return sentence_analysis


# ===============================================
# API ENDPOINTS
# ===============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Plagiarism Detection API is running',
        'models_loaded': True
    })


@app.route('/api/check-plagiarism', methods=['POST'])
def check_plagiarism():
    """
    Main endpoint for plagiarism detection
    Request body: { "text": "query text here" }
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Missing "text" field in request body'
            }), 400
        
        query_text = data['text'].strip()
        if not query_text:
            return jsonify({
                'error': 'Text cannot be empty'
            }), 400
        
        print(f"\n{'='*60}")
        print(f"📝 Processing query ({len(query_text)} chars)")
        print(f"{'='*60}")
        
        # Overall detection
        start_time = time.time()
        result = complete_detector.detect(query_text, verbose=False)
        detection_time = time.time() - start_time
        
        # Sentence-level analysis
        start_time = time.time()
        sentence_analysis = analyze_sentences(query_text)
        analysis_time = time.time() - start_time
        
        # Prepare response
        best_match = result.get('best_match')
        top_results = result.get('top_results', [])
        
        # Get source info for best match
        source_info = None
        if best_match:
            doc_id = best_match['doc_id']
            if doc_id in doc_metadata_map:
                doc_meta = doc_metadata_map[doc_id]
                source_info = {
                    'doc_id': doc_id,
                    'title': doc_meta.get('title'),
                    'url': doc_meta.get('source_url') or doc_meta.get('url'),
                    'author': doc_meta.get('author'),
                    'final_score': best_match['final_score']
                }
        
        # Format top matches
        top_matches = []
        for doc_score in top_results[:5]:
            doc_id = doc_score['doc_id']
            if doc_id in doc_metadata_map:
                doc_meta = doc_metadata_map[doc_id]
                top_matches.append({
                    'doc_id': doc_id,
                    'title': doc_meta.get('title'),
                    'url': doc_meta.get('source_url') or doc_meta.get('url'),
                    'score': doc_score['final_score'],
                    'num_chunks': doc_score['num_chunks']
                })
        
        response = {
            'is_plagiarism': result['prediction'],
            'confidence': round(result['confidence'], 4),
            'threshold': result['threshold'],
            'original_probability': round(1.0 - result['confidence'], 4),
            'best_match': source_info,
            'top_matches': top_matches,
            'sentence_analysis': sentence_analysis,
            'stats': {
                'query_words': result['query_words'],
                'query_chunks': result['query_chunks'],
                'corpus_matches': result['corpus_matches'],
                'detection_time': round(detection_time, 3),
                'analysis_time': round(analysis_time, 3),
                'total_time': round(detection_time + analysis_time, 3)
            }
        }
        
        print(f"✅ Detection completed in {detection_time + analysis_time:.3f}s")
        print(f"   Result: {'PLAGIARISM' if result['prediction'] else 'ORIGINAL'}")
        print(f"   Confidence: {result['confidence']:.4f}")
        
        return jsonify(response)
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'message': 'Internal server error'
        }), 500


@app.route('/api/analyze-sentences', methods=['POST'])
def analyze_sentences_endpoint():
    """
    Endpoint for sentence-level analysis only
    Request body: { "text": "query text here" }
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Missing "text" field in request body'
            }), 400
        
        query_text = data['text'].strip()
        if not query_text:
            return jsonify({
                'error': 'Text cannot be empty'
            }), 400
        
        sentence_analysis = analyze_sentences(query_text)
        
        return jsonify({
            'sentences': sentence_analysis,
            'total_sentences': len(sentence_analysis),
            'suspicious_count': sum(1 for s in sentence_analysis if s['is_suspicious'])
        })
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({
            'error': str(e),
            'message': 'Internal server error'
        }), 500


# ===============================================
# AI DETECTION FUNCTIONS
# ===============================================

def get_ai_label(confidence):
    """Convert confidence score to label"""
    if confidence < 0.4:
        return "Nguoi viet"
    elif confidence < 0.6:
        return "Nghi van"
    elif confidence < 0.8:
        return "Co dau hieu AI"
    else:
        return "AI viet"


def analyze_ai_with_windows(text, clf_model, ai_tokenizer, max_windows=None, stride_tokens=128):
    """
    Analyze text with sliding windows to get sentence-level scores
    Returns list of sentences with their AI scores
    """
    try:
        sentences = [s.strip() for s in re.split(r"(?<=[.!?...])\s+", text) if s.strip()]
        ai_analysis = []
        window_scores = []
        
        for idx, sentence in enumerate(sentences):
            word_count = len(sentence.split())
            
            result = {
                'sentence': sentence,
                'sentence_index': idx,
                'word_count': word_count,
                'is_suspicious': False,
                'confidence': 0.0,
                'label': 'Nguoi viet'
            }
            
            if word_count < 5:
                ai_analysis.append(result)
                continue
            
            try:
                ids = ai_tokenizer(sentence, add_special_tokens=False, truncation=False).get('input_ids', [])
                if not ids:
                    ai_analysis.append(result)
                    continue
                    
                n_special = 2
                win_len = max(8, int(256) - n_special)
                
                sent_probs = []
                if len(ids) <= win_len:
                    ids_with_special = ai_tokenizer.build_inputs_with_special_tokens(ids)
                    prob_ai = _predict_prob_from_ids_simple(ids_with_special, clf_model)
                    sent_probs.append(prob_ai)
                else:
                    stride = min(max(1, stride_tokens), win_len)
                    for start in range(0, len(ids), stride):
                        chunk = ids[start:start + win_len]
                        if len(chunk) < 8:
                            break
                        ids_with_special = ai_tokenizer.build_inputs_with_special_tokens(chunk)
                        sent_probs.append(_predict_prob_from_ids_simple(ids_with_special, clf_model))
                        if max_windows and len(sent_probs) >= max_windows:
                            break
                        if start + win_len >= len(ids):
                            break
                
                if sent_probs:
                    avg_prob = float(np.mean(sent_probs))
                    result['confidence'] = round(avg_prob, 4)
                    result['is_suspicious'] = avg_prob >= 0.6
                    result['label'] = get_ai_label(avg_prob)
                    window_scores.extend(sent_probs)
                    
            except Exception as e:
                print(f"Warning processing sentence {idx}: {e}")
            
            ai_analysis.append(result)
        
        return ai_analysis, window_scores
        
    except Exception as e:
        print(f"Error in analyze_ai_with_windows: {e}")
        return [], []


def _predict_prob_from_ids_simple(input_ids_1d, model):
    """Simple prediction from token IDs"""
    try:
        import torch
        ids = torch.tensor([input_ids_1d], device='cuda' if torch.cuda.is_available() else 'cpu')
        attn = torch.ones_like(ids)
        with torch.inference_mode():
            logits = model(input_ids=ids, attention_mask=attn).logits
            prob_ai = torch.softmax(logits, dim=-1)[0, 1].item()
        return float(prob_ai)
    except Exception as e:
        print(f"Error in prediction: {e}")
        return 0.0


@app.route('/api/check-ai', methods=['POST'])
def check_ai():
    """
    AI detection endpoint
    Request body: { "text": "text to check" }
    Response: {
        "combined_prob_ai": 0.75,
        "combined_label": "Co dau hieu AI",
        "sentence_analysis": [...],
        "high_risk_sentences": [...]
    }
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Missing "text" field in request body'
            }), 400
        
        query_text = data['text'].strip()
        if not query_text:
            return jsonify({
                'error': 'Text cannot be empty'
            }), 400
        
        if not os.path.exists(str(BASE_DIR / 'model' / 'detector_phobert')):
            return jsonify({
                'error': 'AI model not found. Please ensure detector_phobert model is available.',
                'model_path': str(BASE_DIR / 'model' / 'detector_phobert')
            }), 500
        
        try:
            from transformers import AutoModelForSequenceClassification, AutoTokenizer
            
            model_path = str(BASE_DIR / 'model' / 'detector_phobert')
            
            if not hasattr(check_ai, 'ai_model') or check_ai.ai_model is None:
                check_ai.ai_model = AutoModelForSequenceClassification.from_pretrained(model_path)
                check_ai.ai_model.eval()
                check_ai.ai_tokenizer = AutoTokenizer.from_pretrained(model_path, use_fast=True)
                print("Loaded AI detection model")
            
            ai_model = check_ai.ai_model
            ai_tokenizer = check_ai.ai_tokenizer
            
        except Exception as e:
            print(f"Error loading AI model: {e}")
            return jsonify({
                'error': f'Failed to load AI detection model: {str(e)}'
            }), 500
        
        try:
            sentence_analysis, window_scores = analyze_ai_with_windows(query_text, ai_model, ai_tokenizer)
            
            overall_score = float(np.mean(window_scores)) if window_scores else 0.0
            
            high_risk_sentences = [s for s in sentence_analysis if s['is_suspicious'] and s['confidence'] >= 0.6]
            
            response = {
                'combined_prob_ai': round(overall_score, 4),
                'combined_label': get_ai_label(overall_score),
                'sentence_count': len(sentence_analysis),
                'suspicious_count': len(high_risk_sentences),
                'sentence_analysis': sentence_analysis,
                'high_risk_sentences': high_risk_sentences,
                'stats': {
                    'total_sentences': len(sentence_analysis),
                    'avg_confidence': round(float(np.mean([s['confidence'] for s in sentence_analysis])), 4) if sentence_analysis else 0.0,
                    'max_confidence': round(max([s['confidence'] for s in sentence_analysis]), 4) if sentence_analysis else 0.0
                }
            }
            
            return jsonify(response)
            
        except Exception as e:
            print(f"Error during AI analysis: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'error': f'Analysis failed: {str(e)}'
            }), 500
    
    except Exception as e:
        print(f"Error in check_ai endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'message': 'Internal server error'
        }), 500


# ===============================================
# RUN SERVER
# ===============================================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 STARTING FLASK SERVER")
    print("="*60)
    print("   Server will run on: http://localhost:5000")
    print("   API endpoint: http://localhost:5000/api/check-plagiarism")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
