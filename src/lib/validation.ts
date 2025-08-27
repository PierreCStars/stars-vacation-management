import { z } from "zod";

export const VacationRequestSchema = z.object({
  startDate: z.string().min(10),
  endDate: z.string().min(10),
  reason: z.string().optional(),
  company: z.string().optional(),
  type: z.string().optional(),
  isHalfDay: z.boolean().optional().default(false),
  halfDayType: z.enum(["morning", "afternoon"]).nullable().optional(),
}).superRefine((data, ctx) => {
  const s = new Date(data.startDate);
  const e = new Date(data.endDate);

  if (data.isHalfDay) {
    if (!data.halfDayType) {
      ctx.addIssue({ 
        code: z.ZodIssueCode.custom, 
        message: "Select Morning or Afternoon for half-day." 
      });
    }
    // Half-day must be a single day
    if (data.startDate !== data.endDate) {
      ctx.addIssue({ 
        code: z.ZodIssueCode.custom, 
        message: "Half-day must be a single date." 
      });
    }
  } else {
    // Full day: ensure start <= end
    if (s > e) {
      ctx.addIssue({ 
        code: z.ZodIssueCode.custom, 
        message: "Start date must be before or same as end date." 
      });
    }
  }
});
