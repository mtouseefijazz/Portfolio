export interface Profile {
  id: string;
  user_id: string | null;
  name: string;
  tagline: string;
  bio: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  project_url: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  user_id: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  name: string;
  level: string;
}

export interface Tool {
  name: string;
}

export interface LearningItem {
  name: string;
}

export interface ContentItem {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  icon_name: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Message {
  id: string;
  visitor_id: string;
  visitor_name: string;
  visitor_email: string;
  sender: 'visitor' | 'admin';
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Member {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
  login_count: number;
  last_login_at: string | null;
  pages_visited: number;
  action_count: number;
}

export interface CommunityMessage {
  id: string;
  user_id: string;
  author_email: string;
  content: string;
  created_at: string;
}

export interface EmailChange {
  id: string;
  old_email: string | null;
  new_email: string | null;
  changed_at: string;
}
