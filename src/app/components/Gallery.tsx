"use client"
import { useState, useEffect } from "react"

const PHOTOS = [
  "1tfQeIMrHXpsC6XVya59qMojMq5FdXrAV",
  "1Hq5jVR1sDZAXOT9ifpYNZ_yQHIhnD1HL",
  "1-DinQJsXHN7nNQlIjrYImWarjOxHp5Te",
  "1WckejYJ4oPCWYvM4AEEB65Vgpv93BDfu",
  "1uLr-cxB7a6A-KyfiNFLauLx_46h_J544",
  "1Ec3-kwgqbmYeE8Gvmq7jmxH5PO4nRfdw",
  "1cZX0ONwiu-LxTANH3-5oRwspvzX3uA5T",
  "10Tzxs021QjZiHl8gcpLDovoxLhf7Yqiw",
  "1Z401Wy0kYYQxhbv3IZ-ndtjV5hGPI6ka",
  "1d2V_DgvJ55E4z-GflKW1V2rIFbbTLiYm",
  "1IY5OOrFQVg2ZeJqk7DdNSVZgT8KBpqe5",
  "1SSOuHR17oe22ps0QF5xmTeNTTtN5zeNd",
  "1Qhr5HJyiUOriSc5HO04OpD7YfddXsZaT",
  "1vk7owPoCATj4CTe9O7I5a-x-QVJ2bPwd",
  "1ZKa-7Z-7cCJT2aEPJOLuSyk4Xa328KSY",
  "1XwretqKpVIPIGLuWMum_XM2UWu9T-kw4",
  "1uxUduxGmjHyIl5SdRrby3KMm9lxZ8riN",
  "1wAjR5zST4f0EZzSOFKqeRy5YC8LySmXW",
  "1NJ4Eqau5KUwpGlLCv79bFRq6x3nuZiYa",
  "1RWq2dNH6vdjF0GJ8TVMKRw5LinmnIYBY",
  "1JNLVebe-D2fiJCKRoqtBXGuYEG7VUac1",
  "17KqYSy713y6M-yTYlxjgYyiVAI98_Zvn",
  "1kk5DdaBxguorhfazyEWCfYdpqJTtOZBX",
  "1xiAu7epkTL5fI0mxqnwLBfYUJ3vQaiQu",
  "1fpfDR-ib1gx6bhz6buOI5ZW0zTu-nw8X",
  "15yo4lpq3N48NfinQnTl1YTup6jFOy0se",
  "1rt7shanWznlHIMlbDZQERmsuU3577F5c",
  "1ySZ58y28COT_inQ7PrjQviM7nvH6z9l0",
  "1CDrnDZae2zAPMluFg6vYp9jDOWfY3kGS",
  "1lLQ1ArUrf0ry9-KcrZVy8Vs4oYAejQ5f",
  "1SvP3-5v8FA6Eidao7r-m8fbSaS0UOx6j",
  "1Bh_3ywj_OXoqd5Of1YkZrE9CafkSBnEy",
  "13kU74ROe4nESt1Eol_H_mazYw_Vllv-k",
  "1jf7xisDW4PDqaDekBxz4mDAddg5PDmw1",
  "12VwFyd6NBo90aCe7H0YjLiZK9ffS9gP_",
  "1Pa6L6fPmaXxj8BAd2obyh5A74Hj4nJc3",
  "1diTA9eCPowRgElfEfC0-tuRIxHcYvfX-",
  "14H6hOpZVlGTvdmFTe68YTeiL8HJVC-e5",
  "1IaEv_7KzCgpK5GSVk0RZCehDKbskdL11",
  "1pkxzvdaclf9jg8MEu7Tpmre6-p8icd9K",
  "1C2P5ABsPKIzzZNAoZUr-e858K_Zb2NF4",
  "188WOJ2X8U_VRe4svwancCz6H6YOMZkDK",
  "1h89sx-5bzDdaA_W09HYr9BXGTcikxIlb",
]

const VIDEOS = [
  "1IzsAZxVINlrY9qqINlpw6Y234Q2uKY1J",
  "1BTKmm8PcM5QDi0xpHTTnaNzL6DKMxqnr",
  "14tS0il6gdssJLBrwHUn6aSV1AfFve5ib",
  "1QLtsbHuUgSYnB9JDzxrp39CRdJV7USnD",
  "1IBas_kgr4SgO1PPH0h0DYR897tQ7MGDF",
  "1du6IjMQSuNUMOZd76KeOlbRzgyObvS5U",
  "16VZiPCxkM73yJ-Hq4nzZWJ55OKuFPGhc",
  "14K_8_PB5yeByqlPqGYnFG4ax7S4Li8Zt",
]

type Item = { t: "p" | "v"; id: string }

const ITEMS: Item[] = (() => {
  const out: Item[] = []
  let p = 0, v = 0
  while (p < PHOTOS.length || v < VIDEOS.length) {
    for (let k = 0; k < 3 && p < PHOTOS.length; k++) out.push({ t: "p", id: PHOTOS[p++] })
    if (v < VIDEOS.length) out.push({ t: "v", id: VIDEOS[v++] })
  }
  return out
})()

// ── Fisher-Yates shuffle — fresh order every page load ──────────────────────
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const S = {
  section: {
    background: "#030305",
    padding: "100px 0",
  } as React.CSSProperties,
  header: {
    textAlign: "center" as const,
    marginBottom: "60px",
  },
  label: {
    display: "block",
    fontFamily: "'Courier New',monospace",
    fontSize: "8px",
    letterSpacing: "10px",
    textTransform: "uppercase" as const,
    color: "#9a7a36",
    marginBottom: "14px",
  },
  sublabel: {
    fontFamily: "'Courier New',monospace",
    fontSize: "9px",
    letterSpacing: "5px",
    textTransform: "uppercase" as const,
    color: "rgba(255,255,255,0.13)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "3px",
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 20px",
  } as React.CSSProperties,
  card: {
    position: "relative" as const,
    aspectRatio: "2/3",
    overflow: "hidden",
    cursor: "pointer",
    background: "#08080b",
  },
  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
    opacity: 0.88,
    transition: "opacity .4s, transform .5s",
  },
  playRing: {
    position: "absolute" as const,
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none" as const,
  },
  playIcon: {
    width: 44,
    height: 44,
    border: "1px solid rgba(201,168,76,.5)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(201,168,76,.75)",
    fontSize: 14,
    paddingLeft: 3,
  },
  gradient: {
    position: "absolute" as const,
    bottom: 0, left: 0, right: 0,
    padding: "28px 10px 8px",
    background: "linear-gradient(transparent,rgba(3,3,5,.8))",
    pointerEvents: "none" as const,
  },
  tag: {
    fontFamily: "'Courier New',monospace",
    fontSize: "7px",
    letterSpacing: "3px",
    color: "rgba(201,168,76,.38)",
  },
  overlay: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 9999,
    background: "rgba(3,3,5,.97)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute" as const,
    top: 20,
    right: 24,
    background: "transparent",
    border: "1px solid rgba(201,168,76,.28)",
    color: "rgba(201,168,76,.65)",
    fontFamily: "'Courier New',monospace",
    fontSize: "9px",
    letterSpacing: "4px",
    textTransform: "uppercase" as const,
    padding: "8px 18px",
    cursor: "pointer",
  },
}

export default function Gallery() {
  const [lb, setLb] = useState<Item | null>(null)
  // Render server-matched order first, then shuffle once mounted —
  // gives a fresh sequence on every refresh without a hydration mismatch.
  const [items, setItems] = useState<Item[]>(ITEMS)
  useEffect(() => { setItems(shuffle(ITEMS)) }, [])

  return (
    <>
      <section id="gallery" style={S.section}>
        <div style={S.header}>
          <span style={S.label}>The Shadow Gallery</span>
          <span style={S.sublabel}>{PHOTOS.length + VIDEOS.length} works &mdash; photographs &amp; moving images</span>
        </div>

        <div style={S.grid}>
          {items.map((item, i) => (
            <div key={i} onClick={() => setLb(item)} style={S.card}>
              <img
                src={`https://drive.google.com/thumbnail?id=${item.id}&sz=w800`}
                alt=""
                loading="lazy"
                style={S.img}
                onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1.05)" }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1)" }}
              />
              {item.t === "v" && (
                <div style={S.playRing}>
                  <div style={S.playIcon}>&#9654;</div>
                </div>
              )}
              <div style={S.gradient}>
                <span style={S.tag}>{item.t === "v" ? "▶ " : ""}{String(i + 1).padStart(3, "0")}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {lb && (
        <div style={S.overlay} onClick={() => setLb(null)}>
          <div onClick={e => e.stopPropagation()}>
            {lb.t === "p" ? (
              <img
                src={`https://drive.google.com/thumbnail?id=${lb.id}&sz=w2000`}
                alt=""
                style={{ maxWidth: "92vw", maxHeight: "88vh", objectFit: "contain" }}
              />
            ) : (
              <iframe
                src={`https://drive.google.com/file/d/${lb.id}/preview`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                style={{ width: "80vw", height: "80vh", border: "none" }}
              />
            )}
          </div>
          <button style={S.closeBtn} onClick={() => setLb(null)}>Close</button>
        </div>
      )}
    </>
  )
}
