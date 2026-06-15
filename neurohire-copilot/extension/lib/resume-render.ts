import { ProfileData } from "./profile";
import { TailorOutput } from "./vector-cache";

export function generateResumeHtml(profile: ProfileData, tailorOutput: TailorOutput): string {
  const bulletItems = tailorOutput.tailored_bullets
    .map(b => `<li><strong>${b.project_or_role}:</strong> ${b.bullet}</li>`)
    .join("\n");

  const experienceItems = (profile.experience || [])
    .map(exp => `
      <div class="section-item">
        <div class="item-header">
          <span class="bold">${exp.company}</span>
          <span>${exp.period}</span>
        </div>
        <div class="item-subheader italic">${exp.role}</div>
        <p>${exp.description}</p>
      </div>
    `).join("\n");

  const projectItems = profile.top_projects
    .map(proj => `
      <div class="section-item">
        <div class="item-header">
          <span class="bold">${proj.name}</span>
          <a href="${proj.live_url}" target="_blank">${proj.live_url}</a>
        </div>
        <p>${proj.description}</p>
      </div>
    `).join("\n");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${profile.name} - Resume</title>
      <style>
        body {
          font-family: 'Inter', system-ui, sans-serif;
          color: #1a1a1a;
          line-height: 1.5;
          margin: 0;
          padding: 40px;
          font-size: 14px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .name {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .contacts {
          margin-top: 8px;
          font-size: 13px;
          color: #4b5563;
        }
        .contacts a {
          color: #4b5563;
          text-decoration: none;
        }
        .section-title {
          font-size: 16px;
          font-weight: 700;
          text-transform: uppercase;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 4px;
          margin-top: 25px;
          margin-bottom: 15px;
          letter-spacing: 0.5px;
        }
        .section-item {
          margin-bottom: 15px;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
        }
        .bold {
          font-weight: 600;
        }
        .italic {
          font-style: italic;
        }
        .contacts span:not(:last-child)::after {
          content: " | ";
          margin: 0 8px;
        }
        ul {
          margin: 5px 0;
          padding-left: 20px;
        }
        li {
          margin-bottom: 4px;
        }
        @media print {
          body {
            padding: 0;
            font-size: 12px;
          }
          a {
            text-decoration: none;
            color: black;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="name">${profile.name}</h1>
        <div class="contacts">
          <span>Email: <a href="mailto:${profile.email}">${profile.email}</a></span>
          <span>GitHub: <a href="${profile.github}">${profile.github}</a></span>
          <span>Portfolio: <a href="${profile.portfolio}">${profile.portfolio}</a></span>
        </div>
      </div>

      <div class="section-title">Professional Summary</div>
      <p>${profile.experience_summary}</p>

      <div class="section-title">Tailored Experience Highlights</div>
      <ul>
        ${bulletItems}
      </ul>

      <div class="section-title">Work History</div>
      ${experienceItems}

      <div class="section-title">Core Projects</div>
      ${projectItems}

      <div class="section-title">Technical Skills</div>
      <p>${profile.top_skills.join(", ")}</p>
    </body>
    </html>
  `;
}

export function renderAndPrint(profile: ProfileData, tailorOutput: TailorOutput, win = window): void {
  const html = generateResumeHtml(profile, tailorOutput);
  const printWindow = win.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // Short timeout to let layouts settle
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
