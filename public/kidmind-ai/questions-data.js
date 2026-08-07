/** Shared question bank — built-in + admin custom questions */
var QUESTION_BANK = typeof QuestionBank !== "undefined"
  ? QuestionBank.getAll()
  : (typeof QUESTION_BANK_RAW !== "undefined" ? QUESTION_BANK_RAW : []);
