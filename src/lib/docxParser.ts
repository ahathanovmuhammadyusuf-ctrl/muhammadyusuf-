import mammoth from 'mammoth';
import { QuestionType } from '../types';

export interface ParsedOption {
  letter: string;
  text: string;
  isCorrect: boolean;
}

export interface ParsedQuestion {
  tempId: string;
  orderNum: number;
  questionText: string;
  type: QuestionType;
  options: ParsedOption[];
  points: number;
  explanation: string;
  errors: string[];
}

export interface DocxParseResult {
  success: boolean;
  questions: ParsedQuestion[];
  generalErrors: string[];
  totalQuestions: number;
  validQuestions: number;
}

/**
 * Parses raw text into questions structure according to format:
 * 1. Savol matni?
 *    A) Variant
 *    *B) To'g'ri variant
 *    C) Variant
 *    D) Variant
 */
export function parseQuestionsFromRawText(text: string): DocxParseResult {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const questions: ParsedQuestion[] = [];
  const generalErrors: string[] = [];

  let currentQuestion: Partial<ParsedQuestion> | null = null;
  let currentOptions: ParsedOption[] = [];
  let questionIndex = 0;

  const commitCurrentQuestion = () => {
    if (!currentQuestion) return;

    questionIndex++;
    const errors: string[] = [];

    // Validation 1: Question text check
    if (!currentQuestion.questionText || currentQuestion.questionText.trim().length === 0) {
      errors.push(`${questionIndex}-savol: Savol matni bo'sh bo'lishi mumkin emas.`);
    }

    // Validation 2: Option count check
    if (currentOptions.length < 2) {
      errors.push(`${questionIndex}-savolda variantlar yetarli emas (kamida 2 ta variant bo'lishi shart).`);
    }

    // Validation 3: Correct answer check
    const correctCount = currentOptions.filter((o) => o.isCorrect).length;
    if (correctCount === 0) {
      errors.push(`${questionIndex}-savolda to'g'ri javob (*) belgilanmagan.`);
    } else if (correctCount > 1) {
      errors.push(`${questionIndex}-savolda bir nechta (${correctCount} ta) to'g'ri javob (*) topildi.`);
    }

    // Determine type
    const isTrueFalse =
      currentOptions.length === 2 &&
      currentOptions.some((o) => /to['`’]?g['`’]?ri/i.test(o.text) || /rost/i.test(o.text)) &&
      currentOptions.some((o) => /noto['`’]?g['`’]?ri/i.test(o.text) || /yolg['`’]?on/i.test(o.text));

    questions.push({
      tempId: `temp-${Date.now()}-${questionIndex}`,
      orderNum: questionIndex,
      questionText: currentQuestion.questionText || '',
      type: isTrueFalse ? 'TRUE_FALSE' : 'SINGLE_CHOICE',
      options: [...currentOptions],
      points: currentQuestion.points || 1,
      explanation: currentQuestion.explanation || '',
      errors,
    });

    currentQuestion = null;
    currentOptions = [];
  };

  // Regex patterns
  // 1. Savol... or 1) Savol...
  const questionHeaderRegex = /^(\d+)[\.\)]\s*(.+)/;
  // A) ... or *A) ... or A. ... or *A. ...
  const optionRegex = /^(\*?)\s*([A-Za-z0-9А-Яа-я])[\.\)]\s*(.+)/;
  // Explanation prefix: Izoh: ... or Explanation: ...
  const explanationRegex = /^(?:izoh|explanation|tushuntirish):\s*(.+)/i;

  for (const line of lines) {
    const qMatch = line.match(questionHeaderRegex);
    if (qMatch) {
      // If we had a previous question being gathered, save it
      if (currentQuestion) {
        commitCurrentQuestion();
      }
      currentQuestion = {
        questionText: qMatch[2].trim(),
        points: 1,
        explanation: '',
      };
      currentOptions = [];
      continue;
    }

    const optMatch = line.match(optionRegex);
    if (optMatch && currentQuestion) {
      const isCorrect = optMatch[1] === '*';
      const letter = optMatch[2].toUpperCase();
      const text = optMatch[3].trim();

      currentOptions.push({
        letter,
        text,
        isCorrect,
      });
      continue;
    }

    const expMatch = line.match(explanationRegex);
    if (expMatch && currentQuestion) {
      currentQuestion.explanation = expMatch[1].trim();
      continue;
    }

    // If continuation of question text or option
    if (currentQuestion) {
      if (currentOptions.length > 0) {
        // Append to last option
        currentOptions[currentOptions.length - 1].text += ' ' + line;
      } else {
        // Append to question text
        currentQuestion.questionText += ' ' + line;
      }
    }
  }

  // Commit last question
  if (currentQuestion) {
    commitCurrentQuestion();
  }

  if (questions.length === 0) {
    generalErrors.push(
      "Hech qanday savol topilmadi. Iltimos, formatni tekshiring: '1. Savol matni?' va variantlar 'A) Variant', '*B) To'g'ri variant'."
    );
  }

  const validQuestions = questions.filter((q) => q.errors.length === 0).length;

  return {
    success: questions.length > 0,
    questions,
    generalErrors,
    totalQuestions: questions.length,
    validQuestions,
  };
}

/**
 * Parses a .docx File object using mammoth in the browser
 */
export async function parseDocxFile(file: File): Promise<DocxParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const rawText = result.value;
    return parseQuestionsFromRawText(rawText);
  } catch (error: any) {
    return {
      success: false,
      questions: [],
      generalErrors: [`Faylni o'qishda xatolik yuz berdi: ${error?.message || "Noma'lum xatolik"}`],
      totalQuestions: 0,
      validQuestions: 0,
    };
  }
}
