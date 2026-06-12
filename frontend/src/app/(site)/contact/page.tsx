import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Github, Linkedin } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/animations/reveal";
import { ContactForm } from "@/components/forms/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with me for freelance work, collaborations, or just to say hello.",
};

const contactInfo = {
  email: "rajat.kumar.r@outlook.com",
  location: "Bangalore, India",
  socialLinks: [
    {
      name: "GitHub",
      href: "https://github.com/rajat157",
      icon: Github,
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/rajat-kumar-r",
      icon: Linkedin,
    },
  ],
};

export default function ContactPage() {
  return (
    <div className="py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Page Header */}
        <Reveal>
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have a project in mind or just want to chat? I&apos;d love to hear from you.
              Fill out the form below or reach out through any of my social channels.
            </p>
          </div>
        </Reveal>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Reveal delay={0.1}>
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Send a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <ContactForm />
              </CardContent>
            </Card>
          </Reveal>

          {/* Contact Info */}
          <Reveal delay={0.2} direction="left">
            <div className="space-y-8">
              {/* Availability Badge */}
              <div>
                <Badge variant="default" className="text-sm py-1 px-3">
                  Available for freelance work
                </Badge>
              </div>

              {/* Contact Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                  <div className="space-y-4">
                    {/* Email */}
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <div className="flex items-center justify-center size-10 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                        <Mail className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium text-foreground">{contactInfo.email}</p>
                      </div>
                    </a>

                    {/* Location */}
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="flex items-center justify-center size-10 rounded-lg bg-muted">
                        <MapPin className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium text-foreground">{contactInfo.location}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Connect with Me</h2>
                  <div className="flex gap-4">
                    {contactInfo.socialLinks.map((social) => (
                      <Link
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center size-12 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
                        aria-label={`Visit my ${social.name} profile`}
                      >
                        <social.icon className="size-5" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Additional Info Card */}
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">Response Time</h3>
                    <p className="text-sm text-muted-foreground">
                      I typically respond to messages within 24-48 hours. For urgent inquiries,
                      please mention &quot;URGENT&quot; in the subject line.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
