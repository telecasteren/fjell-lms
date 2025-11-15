"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, HelpCircle, ChevronDown, ChevronRight } from "lucide-react";
// Simple markdown to HTML converter

interface FAQSection {
  id: string;
  title: string;
  content: string;
}

export default function FAQPage() {
  const [faqSections, setFaqSections] = useState<FAQSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    async function loadFAQ() {
      try {
        const response = await fetch("/api/faq", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setFaqSections(data.sections);
        } else {
          console.error("Failed to load FAQ sections");
        }
      } catch (error) {
        console.error("Error loading FAQ:", error);
      } finally {
        setLoading(false);
      }
    }

    loadFAQ();
  }, []);

  const renderMarkdown = (content: string) => {
    try {
      return (
        content
          // Headers
          .replace(
            /^### (.*$)/gim,
            '<h3 class="text-lg font-semibold mb-3 mt-6 text-foreground">$1</h3>',
          )
          .replace(
            /^## (.*$)/gim,
            '<h2 class="text-xl font-semibold mb-4 mt-8 text-foreground">$1</h2>',
          )
          .replace(
            /^# (.*$)/gim,
            '<h1 class="text-2xl font-bold mb-6 mt-8 text-foreground">$1</h1>',
          )

          // Bold text
          .replace(
            /\*\*(.*?)\*\*/g,
            '<strong class="font-semibold text-foreground">$1</strong>',
          )

          // Lists
          .replace(
            /^- (.*$)/gim,
            '<li class="mb-2 ml-4 text-muted-foreground">• $1</li>',
          )
          .replace(
            /^\* (.*$)/gim,
            '<li class="mb-2 ml-4 text-muted-foreground">• $1</li>',
          )

          // Line breaks and paragraphs
          .replace(
            /\n\n/g,
            '</p><p class="mb-4 text-muted-foreground leading-relaxed">',
          )
          .replace(/\n/g, "<br>")

          // Wrap in paragraph tags
          .replace(
            /^(?!<[h|l])/gm,
            '<p class="mb-4 text-muted-foreground leading-relaxed">',
          )
          .replace(/(?<!>)$/gm, "</p>")

          // Clean up empty paragraphs
          .replace(
            /<p class="mb-4 text-muted-foreground leading-relaxed"><\/p>/g,
            "",
          )

          // Wrap lists in ul tags
          .replace(
            /(<li class="mb-2 ml-4 text-muted-foreground">[\s\S]*?<\/li>)/g,
            '<ul class="mb-6 mt-4 space-y-2">$1</ul>',
          )

          // Clean up nested ul tags
          .replace(/<\/ul>\s*<ul class="mb-6 mt-4 space-y-2">/g, "")
      );
    } catch (error) {
      console.error("Error processing markdown:", error);
      return content;
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading FAQ...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-2">
          <HelpCircle className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        </div>

        <div className="space-y-4">
          {faqSections.map((section) => {
            const isExpanded = expandedSections.has(section.id);

            return (
              <Card key={section.id}>
                <CardHeader
                  className="hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <Button variant="ghost" size="sm" className="h-auto p-1">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div
                      className="space-y-4"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(section.content),
                      }}
                    />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {faqSections.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No FAQ content available at the moment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
