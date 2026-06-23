/**
 * Server actions for the lead flow. Each runs on the server ("use server") so
 * the API base, and any future secrets or server-side validation, stay off the
 * client and lead traffic does not hit the backend cross-origin from the browser.
 */
import * as api from "./api";
import * as account from "./account";
import type { AnswerPayload, LeadPayload, QuestionPayload, ReviewPayload } from "./types";

export async function searchAction(q: string) {
  "use server";
  const term = (q ?? "").trim();
  if (term.length < 1) return { colleges: [], courses: [], exams: [] };
  return api.search(term);
}

export async function cityCollegesAction(city: string) {
  "use server";
  return api.getCityColleges(city);
}

/* Moderated submissions: created content is pending until approved in admin.
 * Honeypot hits are silently dropped (a bot sees the same "pending" success). */

export async function submitReviewAction(collegeId: number, payload: ReviewPayload) {
  "use server";
  if (payload.hp_field && payload.hp_field.trim() !== "") return { status: "rejected" };
  return api.postReview(collegeId, payload);
}

export async function submitQuestionAction(collegeId: number, payload: QuestionPayload) {
  "use server";
  if (payload.hp_field && payload.hp_field.trim() !== "") return { status: "rejected" };
  return api.postQuestion(collegeId, payload);
}

export async function submitAnswerAction(questionId: number, payload: AnswerPayload) {
  "use server";
  if (payload.hp_field && payload.hp_field.trim() !== "") return { status: "rejected" };
  return api.postAnswer(questionId, payload);
}

export async function requestOtpAction(mobile: string) {
  "use server";
  return api.requestOtp(mobile);
}

export async function verifyOtpAction(requestId: string, otp: string) {
  "use server";
  return api.verifyOtp(requestId, otp);
}

export async function submitLeadAction(payload: LeadPayload) {
  "use server";
  // Drop honeypot hits server-side without persisting. Use a distinct sentinel
  // status so the client never mistakes a drop for a created lead.
  if (payload.hp_field && payload.hp_field.trim() !== "") {
    return { id: 0, status: "rejected" };
  }
  // Attach the access token when logged in so the backend links the lead to the
  // account (it then shows in lead history); anonymous submission is unchanged.
  return account.submitLeadMaybeAuthed(payload);
}
