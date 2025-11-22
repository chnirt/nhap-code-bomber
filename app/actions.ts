"use server"

// import { randomUUID } from 'crypto'

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export async function redeemCode(userId: string, code: string) {
  try {
    console.log(`[v0] Attempting to redeem for user: ${userId}`)

    const res = await fetch("https://vgrapi-sea.vnggames.com/coordinator/api/v1/code/redeem", {
      method: "POST",
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "vi-VN,vi;q=0.9,en-AU;q=0.8,en;q=0.7,fr-FR;q=0.6,fr;q=0.5,en-US;q=0.4",
        "content-type": "application/json",
        priority: "u=1, i",
        "sec-ch-ua": '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-client-region": "VN",
        "x-request-id": generateUUID(),
        Referer: "https://giftcode.vnggames.com/",
        Origin: "https://giftcode.vnggames.com",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        serverId: "0",
        gameCode: "622",
        roleId: userId,
        roleName: userId,
        code: code,
      }),
    })

    const data = await res.json()
    console.log(`[v0] Redeem success for ${userId}:`, data)
    return { success: true, data }
  } catch (error: any) {
    console.error("Redeem error:", error)
    return { success: false, error: error.toString() }
  }
}
