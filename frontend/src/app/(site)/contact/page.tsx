import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { HOME } from "@/content/home";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with me for freelance work, collaborations, or just to say hello.",
};

// The sheet language (BUILD-PLAN.md §5 P4 "Contact"): a sheet head and title
// block, then the same routed brief as the home close. No email anywhere
// (D28): the form is the only way in, and it works without JS.
export default function ContactPage() {
  return (
    <div className="sheet">
      <div className="sheet-grid">
        <div className="sh-head">
          <p className="lab">Contact</p>
          <h1 className="sheet-title">Get in touch</h1>
          <p className="sheet-one">
            Have a project in mind or just want to chat? I&apos;d love to hear from you. Fill out the form below or
            reach out through any of my social channels.
          </p>
        </div>

        <aside className="tb" aria-label="Title block">
          <dl>
            <div className="tb-row">
              <dt className="lab">Based</dt>
              <dd>Bangalore, India</dd>
            </div>
            <div className="tb-row">
              <dt className="lab">Replies</dt>
              <dd>usually within {HOME.close.replyHours} hours</dd>
            </div>
          </dl>
          <a className="tb-link" href="https://github.com/rajat157" target="_blank" rel="noopener noreferrer">
            <span>GitHub</span>
            <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a className="tb-link" href="https://www.linkedin.com/in/rajat-kumar-r" target="_blank" rel="noopener noreferrer">
            <span>LinkedIn</span>
            <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </aside>
      </div>

      <section className="contact-grid" id="contact" aria-label="Send Rajat a brief">
        <ContactForm subjects={HOME.subjects} replyHours={HOME.close.replyHours} />
      </section>
    </div>
  );
}
