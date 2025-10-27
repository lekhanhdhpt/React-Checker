import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { ArrowLeft, Download, Share2, AlertCircle } from "lucide-react";

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <nav className="nav-container">
          <div className="nav-content">
            <div className="nav-items">
              <Link to="/" className="nav-logo">
                PlagiarismCheck
              </Link>
            </div>
          </div>
        </nav>
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

  const { overallSimilarity, originalPercentage, plagiarizedPercentage, matches, analyzedText } = result;

  const getHighlightedText = () => {
    if (matches.length === 0) {
      return analyzedText;
    }

    let highlightedText = "";
    let lastIndex = 0;

    const sortedMatches = [...matches].sort((a, b) => a.startIndex - b.startIndex);

    sortedMatches.forEach((match, index) => {
      highlightedText += analyzedText.substring(lastIndex, match.startIndex);
      highlightedText += `<mark class="bg-red-200 text-red-900 px-1 rounded" data-match="${index}">${match.text}</mark>`;
      lastIndex = match.endIndex;
    });

    highlightedText += analyzedText.substring(lastIndex);
    return highlightedText;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="nav-container">
        <div className="nav-content">
          <div className="nav-items">
            <Link to="/" className="nav-logo">
              PlagiarismCheck
            </Link>
            <div className="nav-links">
              <Link to="/checker" className="nav-link">
                Checker
              </Link>
              <Link to="/history" className="nav-link">
                History
              </Link>
            </div>
          </div>
        </div>
      </nav>

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
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Overall Similarity</h3>
              <span className="text-3xl font-bold text-red-600">
                {overallSimilarity.toFixed(1)}%
              </span>
            </div>
            <Progress value={overallSimilarity} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {overallSimilarity > 20
                ? "High similarity detected - Review recommended"
                : overallSimilarity > 10
                ? "Moderate similarity detected"
                : "Low similarity - Looking good!"}
            </p>
          </Card>

          <Card className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Original</div>
                <div className="text-3xl font-bold text-green-600">
                  {originalPercentage.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Plagiarized</div>
                <div className="text-3xl font-bold text-red-600">
                  {plagiarizedPercentage.toFixed(1)}%
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

        {/* Matches Found */}
        {matches.length > 0 && (
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

        {/* Analyzed Text */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Analyzed Text</h2>
          <div
            className="prose max-w-none text-sm leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
          />
          {matches.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Highlighted text indicates potential plagiarism matches.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
