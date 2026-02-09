export type JobStage =
  | 'Applied'
  | 'Shortlisted'
  | 'Interview'
  | 'Offer'
  | 'Hired'
  | 'Rejected';

export interface Job {
  id: string;
  roleType: string;
  clinicName: string;
  city: string;
  country: string;
  specialtyTags: string[];
  employmentType: 'Full-time' | 'Part-time' | 'Locum' | 'Contract' | 'Internship' | 'Temporary';
  shiftType: 'Day' | 'Night' | 'Rotating';
  salaryRange: string;
  benefits: string[];
  requirements: string[];
  postedAt: string;
  experienceLevel: 'Student' | 'New Grad' | 'Junior' | 'Mid' | 'Senior';
  newGradWelcome: boolean;
  trainingProvided: boolean;
  internshipAvailable: boolean;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  orgId: string;
  logoUrl?: string;
  slug?: string;
}

export interface Candidate {
  id: string;
  name: string;
  school: string;
  gradDate: string;
  skills: string[];
  status: JobStage;
  rating: number;
  city: string;
  notes?: string;
  interestedIn?: string;
  jobId: string;
  jobTitle: string;
  isFavorite?: boolean;
  resumePath?: string;
  seekerId?: string;
}


export interface Application {
  id: string;
  jobId: string;
  status: JobStage;
  appliedAt: string;
  candidateName: string;
  jobTitle?: string;
  clinicName?: string;
  location?: string;
  orgId: string;
}


export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
}

export interface Conversation {
  id: string;
  orgId: string;
  seekerId: string;
  jobId?: string | null;
  createdAt: string;
  lastMessageAt: string;
  organization?: {
    org_name: string;
    logo_url?: string | null;
    slug?: string;
  };
  seeker?: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
  job?: {
    title: string;
  };
  lastMessage?: Message; // Virtual field for UI
  unreadCount?: number;
}

export interface Resume {
  id: string;
  name: string;
  uploadedAt: string;
  category?: 'Resume' | 'Cover letter' | 'Portfolio' | 'Certificate' | 'Other';
  url?: string;
  isDefault?: boolean;
}

export interface Education {
  id: string;
  institutionName: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

export interface WorkExperience {
  id: string;
  companyName: string;
  jobTitle: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}
