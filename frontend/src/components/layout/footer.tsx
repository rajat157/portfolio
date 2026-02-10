import Link from "next/link";
import { Github, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";

const socialLinks = [
  { href: "https://github.com/rajat157", icon: Github, label: "GitHub" },
  { href: "https://www.linkedin.com/in/rajat-kumar-r", icon: Linkedin, label: "LinkedIn" },
];

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn("border-t border-border/40 bg-background", className)}>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Portfolio. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <link.icon className="h-5 w-5" />
                <span className="sr-only">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
