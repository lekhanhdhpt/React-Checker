import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Card } from "../components/ui/card";
import { Upload, FileText, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { checkPlagiarism } from "../lib/plagiarism-checker";

const SAMPLE_TEXTS = [
  {
    title: "Academic Essay Sample",
    text: "The impact of climate change on global ecosystems has been a subject of intense scientific scrutiny in recent decades. Rising temperatures, shifting precipitation patterns, and extreme weather events are fundamentally altering habitats and threatening biodiversity worldwide. Scientists have documented significant changes in species distribution, with many organisms migrating toward cooler regions or higher elevations. The interconnected nature of ecosystems means that changes in one species can have cascading effects throughout the food web, potentially leading to ecosystem collapse in vulnerable areas.",
  },
  {
    title: "Technology Article Sample",
    text: "Artificial intelligence continues to revolutionize industries across the globe, from healthcare to finance. Machine learning algorithms can now process vast amounts of data to identify patterns and make predictions with remarkable accuracy. Natural language processing has enabled computers to understand and generate human-like text, powering virtual assistants and chatbots. As AI technology advances, questions about ethics, privacy, and the future of work become increasingly important for society to address.",
  },
  {
    title: "Business Report Sample",
    text: "The global marketplace has undergone significant transformation in the digital age. E-commerce platforms have democratized access to international markets, allowing small businesses to compete on a global scale. Supply chain optimization through advanced analytics has reduced costs and improved efficiency. Companies that embrace digital transformation and data-driven decision-making are better positioned to adapt to changing market conditions and customer preferences.",
  },
];

export default function PlagiarismCheckerHero() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    const words = newText
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    const validTypes = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid file (TXT, PDF, DOC, or DOCX)");
      return;
    }

    try {
      if (file.type === "text/plain") {
        const text = await file.text();
        setText(text);
        const words = text
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0);
        setWordCount(words.length);
      } else {
        setText(`File uploaded: ${file.name}\n\nNote: PDF and DOC file text extraction would be implemented with proper libraries.`);
        setWordCount(0);
      }
    } catch (error) {
      console.error("Error reading file:", error);
      alert("Error reading file. Please try again.");
    }
  };

  const handleSampleClick = (sampleText) => {
    setText(sampleText);
    const words = sampleText
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);
  };

  const handleCheck = async () => {
    if (!text.trim()) {
      alert("Please enter some text to check for plagiarism");
      return;
    }

    setIsChecking(true);

    try {
      const result = await checkPlagiarism(text);
      navigate("/results", { state: { result } });
    } catch (error) {
      console.error("Error checking plagiarism:", error);
      alert("An error occurred while checking for plagiarism. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="p-6">
        <Tabs defaultValue="text">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger triggerValue="text">
              <FileText className="w-4 h-4 mr-2" />
              Text
            </TabsTrigger>
            <TabsTrigger triggerValue="file">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger triggerValue="samples">
              <Sparkles className="w-4 h-4 mr-2" />
              Samples
            </TabsTrigger>
          </TabsList>

          <TabsContent contentValue="text">
            <Textarea
              placeholder="Paste your text here..."
              value={text}
              onChange={handleTextChange}
              className="min-h-[300px] mb-4"
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Word count: {wordCount}
              </span>
              <Button
                onClick={handleCheck}
                disabled={isChecking || !text.trim()}
              >
                {isChecking ? "Checking..." : "Check for Plagiarism"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent contentValue="file">
            <div className="border-2 border-dashed rounded-lg p-12 text-center mb-4">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">
                Drag and drop your file here, or click to browse
              </p>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".txt,.pdf,.doc,.docx"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" as="span">
                  Choose File
                </Button>
              </label>
              {selectedFile && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
            {text && (
              <>
                <Textarea
                  value={text}
                  onChange={handleTextChange}
                  className="min-h-[200px] mb-4"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Word count: {wordCount}
                  </span>
                  <Button
                    onClick={handleCheck}
                    disabled={isChecking || !text.trim()}
                  >
                    {isChecking ? "Checking..." : "Check for Plagiarism"}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent contentValue="samples">
            <div className="space-y-4">
              {SAMPLE_TEXTS.map((sample, index) => (
                <Card
                  key={index}
                  className="p-4 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSampleClick(sample.text)}
                >
                  <h3 className="font-semibold mb-2">{sample.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {sample.text}
                  </p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
