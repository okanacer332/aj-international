import { z } from "zod";

export const createGiftFormSchema = (t: (key: string) => string) =>
  z.object({
    date: z.date({
      required_error: t("hr.gifts.validation.dateRequired"),
    }),
    recipientType: z.enum(["USER", "PERSONNEL"], {
      required_error: t("hr.gifts.validation.typeRequired"),
    }),
    recipientId: z.string().min(1, t("hr.gifts.validation.recipientRequired")),
    description: z.string().optional(),
    lines: z
      .array(
        z.object({
          productId: z.string().min(1, t("hr.gifts.validation.productRequired")),
          quantity: z.coerce.number().min(1, t("hr.gifts.validation.quantityMin")),
          description: z.string().optional(),
        })
      )
      .min(1, t("hr.gifts.validation.linesRequired")),
  });

export type GiftFormValues = z.infer<ReturnType<typeof createGiftFormSchema>>;