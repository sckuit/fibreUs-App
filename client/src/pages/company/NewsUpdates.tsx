import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, Award, Rocket, Users } from "lucide-react";
import { Link } from "wouter";
import GetQuoteDialog from "@/components/GetQuoteDialog";

export default function NewsUpdates() {
  const news = [
    {
      icon: Rocket,
      category: "Product Launch",
      date: "March 15, 2024",
      title: "New Cloud-Based Analytics Platform",
      excerpt: "We're excited to announce our new AI-powered analytics platform that provides advanced threat detection and behavioral analysis for all CCTV systems.",
      readTime: "3 min read"
    },
    {
      icon: Award,
      category: "Company News",
      date: "February 28, 2024",
      title: "FibreUS Wins Security Excellence Award",
      excerpt: "Recognized as the region's top security solutions provider for outstanding service quality and innovative technology implementations.",
      readTime: "2 min read"
    },
    {
      icon: Users,
      category: "Team Expansion",
      date: "February 10, 2024",
      title: "Expanding Our Team",
      excerpt: "We're growing! Join our team of security experts as we open 10 new positions across installation, support, and sales departments.",
      readTime: "2 min read"
    },
    {
      icon: Rocket,
      category: "Technology",
      date: "January 22, 2024",
      title: "5G-Enabled Security Systems",
      excerpt: "Launching our new line of 5G-enabled security cameras with ultra-low latency streaming and enhanced mobile connectivity.",
      readTime: "4 min read"
    },
  ];

  const categories = [
    { name: "Product Updates", count: 12 },
    { name: "Company News", count: 8 },
    { name: "Industry Insights", count: 15 },
    { name: "Customer Stories", count: 10 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <Badge variant="outline" className="mb-4" data-testid="badge-company-category">Company</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">News & Updates</h1>
          <p className="text-xl text-muted-foreground max-w-3xl" data-testid="text-page-description">
            Stay informed about our latest products, company news, and industry insights.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold mb-8">Latest Articles</h2>
              <div className="space-y-6">
                {news.map((article) => (
                  <Card key={article.title} data-testid={`card-news-${article.title.toLowerCase().replace(/\s/g, '-')}`}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <article.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <Badge variant="secondary">{article.category}</Badge>
                            <span className="text-sm text-muted-foreground">{article.date}</span>
                            <span className="text-sm text-muted-foreground">• {article.readTime}</span>
                          </div>
                          <CardTitle className="mb-3">{article.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{article.excerpt}</p>
                      <Button variant="outline" data-testid={`button-read-${article.title.toLowerCase().replace(/\s/g, '-')}`}>
                        Read More
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <Card className="mb-6" data-testid="card-categories">
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <div key={category.name} className="flex items-center justify-between">
                        <span>{category.name}</span>
                        <Badge variant="secondary">{category.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-newsletter">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Newspaper className="h-5 w-5" />
                    Newsletter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Subscribe to our newsletter for the latest security insights and product updates.
                  </p>
                  <GetQuoteDialog>
                    <Button className="w-full" data-testid="button-subscribe">
                      Subscribe Now
                    </Button>
                  </GetQuoteDialog>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold mb-6">Stay Connected</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Get the latest updates on security technology and company news delivered to your inbox.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <GetQuoteDialog>
                <Button size="lg" data-testid="button-subscribe-newsletter">
                  Subscribe to Newsletter
                </Button>
              </GetQuoteDialog>
              <Link href="/login">
                <Button variant="outline" size="lg" data-testid="button-client-portal">
                  Client Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
