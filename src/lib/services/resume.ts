import { GoogleGenerativeAI } from "@google/generative-ai";
import { Education, WorkExperience } from "../types";

export interface ExtractedProfile {
  fullName?: string;
  headline?: string;
  bio?: string;
  location?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  experienceYears?: number;
  school?: string;
  graduationDate?: string;
  education?: Omit<Education, 'id'>[];
  workExperience?: Omit<WorkExperience, 'id'>[];
}

export async function parseResumeWithGemini(text: string, apiKey: string): Promise<ExtractedProfile> {
  const prompt = `
    You are a resume parser. Extract the following information from the resume text below and return it as a valid JSON object.
    Do not include markdown formatting (like \`\`\`json). Just return the raw JSON.
    
    Fields to extract:
    - fullName (string)
    - headline (string: A professional headline like "Senior Dentist" or "Dental Assistant")
    - bio (string: A short professional summary, max 500 chars)
    - location (string: City, Country)
    - email (string)
    - phone (string)
    - skills (array of strings)
    - experienceYears (number: Total years of experience based on work history)
    - school (string: Name of the university or dental school attended)
    - graduationDate (string: Expected or actual graduation date in YYYY-MM format)
    - education (array of objects):
      - institutionName (string)
      - degree (string)
      - fieldOfStudy (string)
      - startDate (string: YYYY-MM-DD format or YYYY-MM)
      - endDate (string: YYYY-MM-DD format, YYYY-MM, or null if current)
      - isCurrent (boolean)
      - description (string)
    - workExperience (array of objects):
      - companyName (string)
      - jobTitle (string)
      - location (string)
      - startDate (string: YYYY-MM-DD format or YYYY-MM)
      - endDate (string: YYYY-MM-DD format, YYYY-MM, or null if current)
      - isCurrent (boolean)
      - description (string: key responsibilities)

    Resume Text:
    ${text}
  `;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-flash-latest which usually has better free tier limits
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    if (!content) {
      throw new Error('No content generated from Gemini');
    }

    // Clean up potential markdown code blocks
    const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing resume with Gemini:', error);
    throw error;
  }
}
