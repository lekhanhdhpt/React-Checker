import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { CheckCircle, Shield, Clock, BarChart3 } from "lucide-react";
import PlagiarismCheckerHero from "../components/PlagiarismCheckerHero";

export default function HomePage() {
  return (
    <div className="page-wrapper">
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

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Detect Plagiarism with Confidence</h1>
          <p className="hero-subtitle">
            Advanced plagiarism detection powered by intelligent algorithms. Paste your text, upload a file, or try a
            sample to get instant results.
          </p>
        </div>
        
        {/* Plagiarism Checker Component */}
        <PlagiarismCheckerHero />
        
        <div className="review-text">
          <div className="review-content">
            <div className="flex items-center gap-1">
              <span className="review-rating">4.5/5</span>
              <span>•</span>
              <span>Based on 12,623 reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stats-item">
            <div className="stats-number">99.9%</div>
            <div className="stats-label">Accuracy Rate</div>
          </div>
          <div className="stats-item">
            <div className="stats-number">10M+</div>
            <div className="stats-label">Documents Checked</div>
          </div>
          <div className="stats-item">
            <div className="stats-number">50K+</div>
            <div className="stats-label">Active Users</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="features-container">
          <h2 className="features-title">Why Choose PlagiarismCheck?</h2>
          <div className="features-grid">
            <Card className="card-feature">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <CheckCircle className="feature-icon" />
                </div>
                <div>
                  <h3 className="feature-title">Accurate Detection</h3>
                  <p className="feature-description">
                    Our advanced algorithms detect even the smallest instances of plagiarism with industry-leading
                    accuracy.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="card-feature">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <Shield className="feature-icon" />
                </div>
                <div>
                  <h3 className="feature-title">Secure & Private</h3>
                  <p className="feature-description">
                    Your documents are encrypted and never stored. We prioritize your privacy and data security above
                    all else.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="card-feature">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <Clock className="feature-icon" />
                </div>
                <div>
                  <h3 className="feature-title">Instant Results</h3>
                  <p className="feature-description">
                    Get comprehensive plagiarism reports in seconds. No waiting, no delays - just fast, accurate
                    results.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="card-feature">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <BarChart3 className="feature-icon" />
                </div>
                <div>
                  <h3 className="feature-title">Detailed Reports</h3>
                  <p className="feature-description">
                    Receive in-depth analysis with highlighted matches, similarity percentages, and source citations.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 PlagiarismCheck. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
