import { MeetingCreateRequest } from "./types";

export interface DemoMeeting extends MeetingCreateRequest {
  description: string;
  expectedOutcome: string;
}

export const DEMO_MEETINGS: Record<string, DemoMeeting> = {
  meeting1: {
    title: "Kickoff Meeting",
    date: "2026-10-03",
    format: "txt",
    description: "Meeting 1: Sets initial baseline decisions and launch target.",
    expectedOutcome: "Stores 'Launch is scheduled for April 2' under Arjun.",
    transcript: `Arjun: Welcome everyone to the Actioned project kickoff.
Arjun: First big milestone: we decided that launch is scheduled for April 2.
Neha: Great. I will prepare the cloud architecture document by next Friday.
Arjun: Sounds good. Let's make sure everyone reviews the spec before end of month.`
  },
  meeting2: {
    title: "Sprint Planning",
    date: "2026-11-14",
    format: "txt",
    description: "Meeting 2: Tests relative deadlines & vague owner detection.",
    expectedOutcome: "Detects vague owner for pricing, resolves 'by Friday' to Nov 20.",
    transcript: `Priya: Okay team, let's review our sprint backlog.
Priya: Someone should look into the pricing page and competitors.
Rahul: I will update the user onboarding flow by Friday.
Priya: We decided to use Tailwind for the design system overhaul.
Rahul: Got it. I'll take care of the component styling as well.`
  },
  meeting3: {
    title: "Planning Review",
    date: "2026-11-21",
    format: "txt",
    description: "Meeting 3: Triggers cross-meeting conflict detection against Meeting 1.",
    expectedOutcome: "Flags conflict with Meeting 1's April 2 launch date; supersedes old decision on approval.",
    transcript: `Priya: Thanks everyone for joining the roadmap review.
Priya: Big update on timeline: we decided that launch moves to March 15.
Rahul: Understood. I will update the launch checklist by next Friday.
Arjun: Wait, earlier we planned for April 2, but March 15 is our new target. Let's make sure marketing is aligned.`
  }
};
