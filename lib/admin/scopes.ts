export const DELETE_SCOPES = [
  "messages",
  "visitor-messages",
  "projects",
  "challenges",
  "submissions",
  "badges",
  "resources",
  "inspiration",
  "activity",
  "profile-lists",
  "content-cards",
] as const;

export type DeleteScope = (typeof DELETE_SCOPES)[number];

export function isDeleteScope(value: string): value is DeleteScope {
  return (DELETE_SCOPES as readonly string[]).includes(value);
}

export const SCOPE_LABELS: Record<DeleteScope, string> = {
  messages: "Messages",
  "visitor-messages": "Visitor Messages",
  projects: "Projects",
  challenges: "Challenges & Missions",
  submissions: "Submissions",
  badges: "Badges & Rewards",
  resources: "Learning Resources",
  inspiration: "Inspiration Messages",
  activity: "Activity History",
  "profile-lists": "Profile Lists",
  "content-cards": "Ideas, Roadmap & Parent Cards",
};

export const SCOPE_DELETE_ALL_LABELS: Record<DeleteScope, string> = {
  messages: "Delete All Messages",
  "visitor-messages": "Delete All Visitor Conversations",
  projects: "Delete All Projects",
  challenges: "Delete All Challenges & Missions",
  submissions: "Delete All Submissions",
  badges: "Delete All Badges",
  resources: "Delete All Learning Resources",
  inspiration: "Delete All Inspiration Messages",
  activity: "Delete All Activity History",
  "profile-lists": "Delete All Profile Lists",
  "content-cards": "Delete All Content Cards",
};

export const SCOPE_WARNINGS: Record<DeleteScope, string> = {
  messages:
    "This permanently deletes every contact-form message in the inbox. This action cannot be undone.",
  "visitor-messages":
    "This permanently deletes every visitor conversation and all replies. This action cannot be undone.",
  projects:
    "This permanently deletes every project from the admin panel and the public portfolio, including project images. This action cannot be undone.",
  challenges:
    "This permanently deletes every daily mission and game challenge, plus their challenge submissions. This action cannot be undone.",
  submissions:
    "This permanently deletes inspiration, guestbook, and challenge submission records only. Challenges themselves are kept. This action cannot be undone.",
  badges: "This permanently deletes every badge and reward record. This action cannot be undone.",
  resources:
    "This permanently deletes every learning resource. This action cannot be undone.",
  inspiration:
    "This permanently deletes every inspiration-wall message. This action cannot be undone.",
  activity:
    "This permanently deletes admin activity history. Future actions will still be logged. This action cannot be undone.",
  "profile-lists":
    "This clears skills, achievements, fun facts, goals, journey steps, and capabilities. The core profile row is kept. This action cannot be undone.",
  "content-cards":
    "This permanently deletes project ideas, roadmap steps, and parent-corner cards. This action cannot be undone.",
};

