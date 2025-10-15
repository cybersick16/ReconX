// Fix: Implement GeminiService to interact with the Google AI SDK
import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse, Chat } from '@google/genai';
import { ScanReport, Vulnerability } from '../models/scan.model';

// Assume process.env.API_KEY is available in the execution environment
declare const process: any;

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private genAI: GoogleGenAI | null = null;
  private chats: Map<string, Chat> = new Map();
  isLoading = signal(false);

  constructor() {
    try {
      if (process.env.API_KEY) {
        this.genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
      } else {
        console.error('API_KEY environment variable not found.');
      }
    } catch (e) {
      console.error('Error initializing GoogleGenAI:', e);
    }
  }

  async getRemediationAnalysis(vulnerability: Vulnerability, context: ScanReport): Promise<string> {
    if (!this.genAI) {
      return 'Gemini AI not initialized. Please check your API key.';
    }

    this.isLoading.set(true);

    const prompt = `
      As a cybersecurity expert, analyze the following security vulnerability and provide a detailed, step-by-step remediation plan.
      The context is a scan report named "${context.name}".

      Vulnerability: ${vulnerability.name}
      Description: ${vulnerability.description}
      Affected Asset: ${vulnerability.affectedAsset}
      Current suggested remediation: ${vulnerability.remediation}

      Provide a clear, actionable remediation plan. Be concise and format the output in markdown.
    `;

    try {
      const response: GenerateContentResponse = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return 'Error analyzing vulnerability. Please try again.';
    } finally {
      this.isLoading.set(false);
    }
  }

  async generateChatMessage(message: string, report: ScanReport | null): Promise<string> {
    if (!this.genAI) {
      return 'Gemini AI not initialized. Please check your API key.';
    }
    this.isLoading.set(true);
    
    const reportId = report?.id ?? 'general';
    let chat = this.chats.get(reportId);

    if (!chat) {
        let systemInstruction = "You are a helpful cybersecurity assistant for a threat analysis dashboard.";
        if (report) {
            const reportContext = { ...report, attackPaths: undefined }; // Exclude verbose attack paths
            systemInstruction += ` The user is viewing the scan report named "${report.name}".
            Here is a JSON summary of the report: ${JSON.stringify(reportContext)}.
            Use this context to answer questions about vulnerabilities, assets, and remediation. Keep your answers concise.`;
        }
        chat = this.genAI.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction },
        });
        this.chats.set(reportId, chat);
    }

    try {
      const response: GenerateContentResponse = await chat.sendMessage({ message });
      return response.text;
    } catch (error) {
        console.error('Error in chat generation:', error);
        return 'Sorry, I encountered an error. Please try again.';
    } finally {
        this.isLoading.set(false);
    }
  }
}
