import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { ServerRuntime } from "next"
import axios from "axios"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"
import { OpenAIStream, StreamingTextResponse } from "ai"

export const runtime: ServerRuntime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages } = json as {
    chatSettings: ChatSettings
    messages: any[]
  }

  try {
    const profile = await getServerProfile()

    checkApiKey(profile.openai_api_key, "OpenAI")

    const apiUrl = "https://llm.baifentan.com/openproxy/rp/v1/chat/completions"
    const apiKey = "zyb-249262d815bb8080b1d5cdf6b7cde064@QAISEO"

    const response = await axios.post(
      apiUrl,
      {
        model: "gpt-4o",
        messages: messages as ChatCompletionCreateParamsBase["messages"],
        temperature: chatSettings.temperature,
        max_tokens:
          chatSettings.model === "gpt-4-vision-preview" ||
          chatSettings.model === "gpt-4o"
            ? 4096
            : null,
        stream: false
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        }
      }
    )
   
    console.log( "执行了")

     // 提取有效的消息内容
    const messageContent = response.data.choices[0].message.content
    return new Response(JSON.stringify({ content: messageContent }), {
      headers: { "Content-Type": "application/json" }
    })
    //return new Response(JSON.stringify(response.data), {
    //headers: { "Content-Type": "application/json" }
   // })
    //const stream = OpenAIStream(response.data)

    //return new StreamingTextResponse(stream)
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.response?.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "API Key not found. Please set it in your profile settings."
    } else if (errorMessage.toLowerCase().includes("incorrect api key")) {
      errorMessage =
        "API Key is incorrect. Please fix it in your profile settings."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
