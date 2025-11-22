import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async () => {
  try {
    const response = await fetch(
      'https://v1.hitokoto.cn/?c=a&c=b&encode=json&charset=utf-8',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      },
    )

    if (!response.ok) {
      console.log(response)
      return new Response(
        JSON.stringify({
          hitokoto: '获取失败',
          from: '系统',
          from_who: null,
          re: response,
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Cache for 60 seconds
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ hitokoto: '网络错误', from: '系统', from_who: null }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
}
