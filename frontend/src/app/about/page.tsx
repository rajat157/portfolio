import type { Metadata } from "next";
import { Reveal } from "@/components/animations/reveal";
import { ExperienceTimeline } from "@/components/about/experience-timeline";
import { SkillsGrid } from "@/components/about/skills-grid";
import {
  MapPin,
  Mail,
  Download,
  ArrowRight,
  GraduationCap,
  Camera,
  Music,
  Film,
  Gamepad2,
  ChefHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about Rajat Kumar R - Software Architect with 8+ years of experience building high-performance systems.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <Reveal>
            <p className="text-muted-foreground text-lg mb-4">About Me</p>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="text-display font-bold tracking-tight mb-4">
              Rajat Kumar R
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-heading text-muted-foreground mb-6">
              Software Architect & Developer
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-8">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Bangalore, India
              </span>
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a
                  href="mailto:rajat.kumar.r@outlook.com"
                  className="hover:text-foreground transition-colors"
                >
                  rajat.kumar.r@outlook.com
                </a>
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Bio Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <Reveal>
            <h2 className="text-heading font-bold mb-8">Who I Am</h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Experienced Software Architect with 8+ years building
                high-performance systems. From managing India&apos;s fastest
                supercomputer (SahasraT at IISc) to architecting real-time
                trading platforms, I bring deep expertise in Python, cloud
                infrastructure, and modern web technologies. Passionate about
                leveraging AI tools like Claude and Gemini to accelerate
                development.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Experience Timeline Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <Reveal>
            <h2 className="text-heading font-bold mb-4 text-center">
              Work Experience
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
              A journey through 8+ years of building systems, leading teams, and
              solving complex technical challenges.
            </p>
          </Reveal>

          <ExperienceTimeline />
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <Reveal>
            <h2 className="text-heading font-bold mb-4 text-center">
              Skills & Technologies
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
              Technologies and tools I work with to build scalable, performant
              applications.
            </p>
          </Reveal>

          <SkillsGrid />
        </div>
      </section>

      {/* Education Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <Reveal>
            <h2 className="text-heading font-bold mb-12 text-center">
              Education
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="bg-card border border-border rounded-xl p-8 flex items-start gap-6">
              <div className="p-3 bg-muted rounded-lg">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">B.E. Computer Science</h3>
                <p className="text-primary font-medium mt-1">
                  ACS College of Engineering, Bangalore
                </p>
                <p className="text-muted-foreground mt-2">Class of 2016</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Interests Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <Reveal>
            <h2 className="text-heading font-bold mb-4 text-center">
              Beyond Code
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="text-muted-foreground text-center mb-12">
              When I&apos;m not building software, you&apos;ll find me exploring
              these creative pursuits.
            </p>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              {
                icon: Camera,
                label: "Photography & Videography",
              },
              {
                icon: Music,
                label: "Music Production",
              },
              {
                icon: Film,
                label: "Video Editing",
              },
              {
                icon: Gamepad2,
                label: "FPS Gaming",
              },
              {
                icon: ChefHat,
                label: "Culinary Arts",
              },
            ].map((interest, index) => (
              <Reveal key={interest.label} delay={index * 0.1}>
                <div className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                  <interest.icon className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">{interest.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="text-heading font-bold mb-4">
              Let&apos;s Work Together
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="text-muted-foreground mb-8">
              I&apos;m always interested in hearing about new projects and
              opportunities. Whether you have a question or just want to say hi,
              feel free to reach out.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full">
                <a href="/contact">
                  Get in Touch
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full"
              >
                <a href="/resume.pdf" download>
                  <Download className="w-4 h-4 mr-2" />
                  Download Resume
                </a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
