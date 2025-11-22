import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, code } = await request.json()

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
        "x-request-id": crypto.randomUUID(),
        Referer: "https://giftcode.vnggames.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
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
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
