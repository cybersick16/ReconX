// Fix: Implement a floating ChatAssistantComponent
import { Component, ChangeDetectionStrategy, inject, signal, viewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { ScanStateService } from '../../services/scan-state.service';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

@Component({
  selector: 'app-chat-assistant',
  template: `
    <div class="fixed bottom-4 right-4 z-50">
      <button (click)="toggleChat()" class="bg-violet-600 text-white rounded-full p-4 shadow-lg hover:bg-violet-700 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 shadow-[0_0_20px_rgba(108,99,255,0.5)]">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      @if (isOpen()) {
        <div class="absolute bottom-20 right-0 w-96 glass-panel flex flex-col h-[32rem]">
          <header class="p-4 border-b border-white/10 flex justify-between items-center">
            <div>
              <h3 class="font-semibold text-white">Cyber Security Assistant</h3>
              @if (currentReport(); as report) {
                <p class="text-xs text-gray-400">Context: {{ report.name }}</p>
              }
            </div>
            <button (click)="toggleChat()" class="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
          </header>

          <div #chatContainer class="flex-1 p-4 overflow-y-auto space-y-4 bg-black/10">
            @for (message of messages(); track $index) {
              <div class="flex" [class.justify-end]="message.role === 'user'">
                <div class="rounded-lg px-4 py-2 max-w-xs border"
                     [class]="message.role === 'user' ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50' : 'bg-violet-500/10 text-violet-200 border-violet-500/30'">
                  {{ message.text }}
                </div>
              </div>
            }
            @if (geminiService.isLoading()) {
              <div class="flex">
                 <div class="rounded-lg px-4 py-2 max-w-xs bg-gray-700/50 text-gray-300 border border-gray-600 animate-pulse">
                  Thinking...
                </div>
              </div>
            }
          </div>

          <footer class="p-4 border-t border-white/10">
            <form (ngSubmit)="sendMessage()" class="flex gap-2">
              <input type="text" [(ngModel)]="userInput" name="userInput"
                     placeholder="Ask about this report..."
                     class="flex-1 p-2 border border-white/20 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-gray-900/80 text-white"
                     [disabled]="geminiService.isLoading()">
              <button type="submit"
                      class="px-4 py-2 bg-cyan-500 text-black font-semibold rounded-md hover:bg-cyan-400 disabled:bg-gray-600 disabled:text-gray-400"
                      [disabled]="geminiService.isLoading() || !userInput.trim()">
                Send
              </button>
            </form>
          </footer>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class ChatAssistantComponent {
  geminiService = inject(GeminiService);
  scanStateService = inject(ScanStateService);
  
  isOpen = signal(false);
  userInput = '';
  messages = signal<ChatMessage[]>([]);
  currentReport = this.scanStateService.selectedReport;
  chatContainer = viewChild<ElementRef<HTMLDivElement>>('chatContainer');

  constructor() {
    effect(() => {
      const report = this.currentReport();
      const reportName = report ? `"${report.name}"` : 'your data';
      this.messages.set([{ role: 'model', text: `Hello! Analyzing ${reportName}. How can I help?` }]);
    }, { allowSignalWrites: true });

    effect(() => {
      if (this.messages() && this.chatContainer()) {
        const container = this.chatContainer()!.nativeElement;
        setTimeout(() => container.scrollTop = container.scrollHeight, 0);
      }
    });
  }

  toggleChat() {
    this.isOpen.update(open => !open);
  }

  async sendMessage() {
    const message = this.userInput.trim();
    if (!message || this.geminiService.isLoading()) return;

    this.messages.update(m => [...m, { role: 'user', text: message }]);
    const currentMessage = this.userInput;
    this.userInput = '';

    const response = await this.geminiService.generateChatMessage(currentMessage, this.currentReport());
    
    this.messages.update(m => [...m, { role: 'model', text: response }]);
  }
}