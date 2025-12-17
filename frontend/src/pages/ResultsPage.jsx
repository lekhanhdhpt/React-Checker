import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { ArrowLeft, Download, Share2, AlertCircle, ExternalLink } from "lucide-react";
import HighlightedText from "../components/HighlightedText";
import Header from "../components/Header";

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">No Results Found</h1>
          <p className="text-muted-foreground mb-8">
            Please check some text for plagiarism first.
          </p>
          <Link to="/checker">
            <Button>Go to Checker</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { overallSimilarity, originalPercentage, plagiarizedPercentage, matches, analyzedText, isPlagiarism, confidence } = result;

  // Get data from new API response format
  const is_plagiarism = result.is_plagiarism !== undefined ? result.is_plagiarism : isPlagiarism;
  const confidence_score = result.confidence !== undefined ? result.confidence : confidence;
  const original_probability = result.original_probability !== undefined 
    ? result.original_probability 
    : (1 - (confidence_score || 0));
  const sentence_analysis = result.sentence_analysis || [];
  const best_match = result.best_match;
  const top_matches = result.top_matches || [];
  const stats = result.stats || {};

  // Fallback to old format if new API data not available
  const plagiarized_pct = is_plagiarism ? (confidence_score * 100) : (plagiarizedPercentage || 0);
  const original_pct = is_plagiarism ? (original_probability * 100) : (originalPercentage || 100);
  const overall_similarity = overallSimilarity || plagiarized_pct;

  const getHighlightedText = () => {
    if (matches.length === 0) {
      return analyzedText;
    }

    let highlightedText = "";
    let lastIndex = 0;

    const sortedMatches = [...matches].sort((a, b) => a.startIndex - b.startIndex);

    sortedMatches.forEach((match, index) => {
      highlightedText += analyzedText.substring(lastIndex, match.startIndex);
      
      // Determine color based on similarity
      const similarity = match.similarity || 1.0;
      let colorClass = 'bg-yellow-200 text-yellow-900'; // Low confidence
      
      if (similarity > 0.8) {
        colorClass = 'bg-red-200 text-red-900'; // High confidence
      } else if (similarity > 0.6) {
        colorClass = 'bg-orange-200 text-orange-900'; // Medium confidence
      }
      
      highlightedText += `<mark class="${colorClass} px-1 rounded" data-match="${index}">${match.text}</mark>`;
      lastIndex = match.endIndex;
    });

    highlightedText += analyzedText.substring(lastIndex);
    return highlightedText;
  };

  // Determine plagiarism status message
  const getPlagiarismStatus = () => {
    if (!is_plagiarism) {
      return {
        label: "KHÔNG ĐẠO VĂN",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      };
    }
    return {
      label: "CÓ DẤU HIỆU ĐẠO VĂN",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    };
  };

  const status = getPlagiarismStatus();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <Header />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/checker">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Check Another Document
            </Button>
          </Link>
        </div>

        {/* Results Summary */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Plagiarism Report</h1>
          <p className="text-muted-foreground">
            Analysis complete - Here are your results
          </p>
        </div>

        {/* Score Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Plagiarism Status Card */}
          <Card className={`p-6 ${status.bgColor} border-2 ${status.borderColor}`}>
            <div className="text-center">
              <div className={`text-3xl font-bold ${status.color} mb-2`}>
                {status.label}
              </div>
              <div className="text-sm text-muted-foreground">Trạng thái</div>
            </div>
          </Card>

          {/* Confidence Score Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Điểm Confidence</h3>
              <span className={`text-3xl font-bold ${confidence_score >= 0.6 ? 'text-red-600' : 'text-green-600'}`}>
                {(confidence_score * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={confidence_score * 100} className="h-3 mb-2" />
            <p className="text-sm text-muted-foreground">
              {confidence_score >= 0.8
                ? "Rất cao - Gần như chắc chắn là đạo văn"
                : confidence_score >= 0.6
                ? "Cao - Có dấu hiệu đạo văn rõ ràng"
                : confidence_score >= 0.4
                ? "Trung bình - Cần xem xét thêm"
                : "Thấp - Văn bản có tính nguyên bản cao"}
            </p>
          </Card>

          {/* Overall Similarity Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Độ Tương Đồng</h3>
              <span className="text-3xl font-bold text-orange-600">
                {overall_similarity.toFixed(1)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Nguyên bản</div>
                <div className="text-2xl font-bold text-green-600">
                  {original_pct.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Đạo văn</div>
                <div className="text-2xl font-bold text-red-600">
                  {plagiarized_pct.toFixed(1)}%
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share Results
          </Button>
        </div>

        {/* Best Match Info */}
        {best_match && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Nguồn Khớp Nhất</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Document ID:</span>
                <p className="font-semibold">{best_match.doc_id}</p>
              </div>
              {best_match.title && (
                <div>
                  <span className="text-sm text-muted-foreground">Tiêu đề:</span>
                  <p className="font-semibold">{best_match.title}</p>
                </div>
              )}
              {best_match.url && (
                <div>
                  <span className="text-sm text-muted-foreground">URL:</span>
                  <a 
                    href={best_match.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                  >
                    {best_match.url}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
              <div>
                <span className="text-sm text-muted-foreground">Điểm khớp:</span>
                <p className="font-semibold text-red-600">{(best_match.final_score * 100).toFixed(1)}%</p>
              </div>
            </div>
          </Card>
        )}

        {/* Top Matches */}
        {top_matches.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Top {top_matches.length} Nguồn Tương Đồng</h2>
            <div className="space-y-4">
              {top_matches.map((match, index) => (
                <div
                  key={index}
                  className="border-l-4 border-orange-500 pl-4 py-2 bg-orange-50 rounded"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">#{index + 1} - {match.doc_id}</span>
                    <span className="text-sm text-orange-600 font-medium">
                      {(match.score * 100).toFixed(1)}% khớp
                    </span>
                  </div>
                  {match.title && (
                    <p className="text-sm mb-2 font-medium">{match.title}</p>
                  )}
                  {match.url && (
                    <a 
                      href={match.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      Xem nguồn
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {match.num_chunks} chunks khớp
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Analyzed Text with Highlights */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Văn Bản Đã Phân Tích</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Các câu được highlight theo mức độ nghi ngờ đạo văn (đỏ = cao, cam = trung bình, vàng = thấp)
          </p>
          {sentence_analysis.length > 0 ? (
            <HighlightedText sentenceAnalysis={sentence_analysis} />
          ) : (
            <div
              className="prose max-w-none text-sm leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
            />
          )}
        </Card>

        {/* Statistics */}
        {stats && Object.keys(stats).length > 0 && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Thống Kê Phân Tích</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.query_words && (
                <div>
                  <div className="text-sm text-muted-foreground">Số từ</div>
                  <div className="text-2xl font-bold">{stats.query_words}</div>
                </div>
              )}
              {stats.query_chunks && (
                <div>
                  <div className="text-sm text-muted-foreground">Số đoạn</div>
                  <div className="text-2xl font-bold">{stats.query_chunks}</div>
                </div>
              )}
              {stats.corpus_matches && (
                <div>
                  <div className="text-sm text-muted-foreground">Nguồn tìm thấy</div>
                  <div className="text-2xl font-bold">{stats.corpus_matches}</div>
                </div>
              )}
              {stats.total_time && (
                <div>
                  <div className="text-sm text-muted-foreground">Thời gian (giây)</div>
                  <div className="text-2xl font-bold">{stats.total_time.toFixed(2)}s</div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Old format fallback - Matches Found */}
        {matches && matches.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Matches Found ({matches.length})</h2>
            <div className="space-y-4">
              {matches.map((match, index) => (
                <div
                  key={index}
                  className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 rounded"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">Match #{index + 1}</span>
                    <span className="text-sm text-red-600 font-medium">
                      {match.similarity}% similarity
                    </span>
                  </div>
                  <p className="text-sm mb-2">{match.text}</p>
                  <p className="text-xs text-muted-foreground">
                    Source: {match.source}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Old format - Analyzed Text (only if no sentence analysis) */}
        {(!sentence_analysis || sentence_analysis.length === 0) && analyzedText && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Analyzed Text</h2>
            <div
              className="prose max-w-none text-sm leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
            />
            {matches && matches.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Highlighted text indicates potential plagiarism matches.
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;
