
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { MenuItem, Hotel } from "../types";
import { TRANSLATIONS } from "../constants";

// Fix: Derived service text from TRANSLATIONS instead of missing SERVICE_ITEMS constant
const getSystemInstruction = (hotel: Hotel, menu: MenuItem[]) => {
  const menuText = menu.map(item => `- ${item.name} (${item.price} TL): ${item.description} [${item.type}]`).join('\n');
  const serviceText = Object.values(TRANSLATIONS.tr.serviceNames).map(name => `- ${name}`).join('\n');

  return `
    Sen '${hotel.name}' otelinin yapay zeka asistanısın. Misafirlerin konaklamasını mükemmel kılmak için varsın.
    
    Karakterin: Kibar, profesyonel, "premium" ve çözüm odaklı.
    
    Verilerin:
    Menü/Market:
    ${menuText}

    Hizmetler:
    ${serviceText}

    Otel Bilgileri:
    - WiFi: ${hotel.wifi_name} (Şifre: ${hotel.wifi_pass})
    - Çıkış Saati: ${hotel.checkout_time}
    - Resepsiyon: ${hotel.reception_phone}

    Yönergeler:
    1. Yemek önerisi istendiğinde menüden ürünler tavsiye et.
    2. Hizmet (havlu, temizlik vb.) taleplerini "Hizmetler" sekmesinden yapabileceklerini hatırlat.
    3. Wifi şifresini sorarlarsa ver.
    4. Sadece bu otel kapsamında cevaplar ver. Türkçe konuş.
  `;
};

// Fix: Initialized GoogleGenAI within the function as per guidelines to ensure fresh API key usage
export const sendMessageToGemini = async (message: string, hotel: Hotel, menu: MenuItem[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // We recreate session per call here to ensure the most up-to-date system instruction is used
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: getSystemInstruction(hotel, menu),
      },
    });

    const response: GenerateContentResponse = await chat.sendMessage({ message });
    // Correctly accessing the .text property of GenerateContentResponse
    return response.text || "Şu an cevap veremiyorum, lütfen resepsiyona başvurun.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Bağlantıda bir sorun oluştu.";
  }
};
