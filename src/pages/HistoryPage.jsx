import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { FileText, Clock } from "lucide-react";

const HistoryPage = () => {
  const mockHistory = [
    {
      id: 1,
      title: "Academic Essay on Climate Change",
      date: "2025-10-25",
      similarity: 15.3,
      wordCount: 450,
    },
    {
      id: 2,
      title: "Technology Article Sample",
      date: "2025-10-24",
      similarity: 28.7,
      wordCount: 320,
    },
    {
      id: 3,
      title: "Business Report Analysis",
      date: "2025-10-23",
      similarity: 8.2,
      wordCount: 680,
    },
  ];

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
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Check History</h1>
          <p className="text-muted-foreground">
            View your previous plagiarism checks
          </p>
        </div>

        <div className="space-y-4">
          {mockHistory.map((item) => (
            <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {item.date}
                      </span>
                      <span>{item.wordCount} words</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    item.similarity > 20 ? "text-red-600" :
                    item.similarity > 10 ? "text-yellow-600" :
                    "text-green-600"
                  }`}>
                    {item.similarity}%
                  </div>
                  <div className="text-sm text-muted-foreground">similarity</div>
                  <Button variant="outline" size="sm" className="mt-2">
                    View Report
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {mockHistory.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No History Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start checking documents to see your history here
            </p>
            <Link to="/checker">
              <Button>Check Your First Document</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
