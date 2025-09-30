import tkinter as tk
from tkinter import messagebox
import json
from dataclasses import dataclass, asdict
from openai import OpenAI

# ===== 속성 목록 & 보정값 =====
attribute_list = ["불","물","흙","얼음","빛","어둠","기계","정신","혼돈","번개"]
attribdict = {"정신":1, "얼음":1.15,"혼돈":1.26,'흙':1.47,"어둠":1.1,
              "불":1.21,"물":1.31,"빛":1.1,"기계":1.15,"번개":1.1}

# ===== DeepSeek API 설정 =====
API_KEY = "sk-ddc13f3767d84349b7cabf6a9435cf07"  # 👉 본인 키로 교체
client = OpenAI(api_key=API_KEY, base_url="https://api.deepseek.com")

# ===== 카드 dataclass =====
@dataclass
class Card:
    id: int
    name: str
    cost: int
    attack: int
    health: int
    maxHealth: int
    attribute: str

# ===== 스탯 추출 함수 =====
def get_stat(description):
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": """지금부터 너한테 몬스터에 대한 설명을 줄건데,
            그 몬스터의 공격력과 방어력을 1에서 10사이의 수치로 하나씩 출력해.
            단 [공격력], [방어력] 형식으로 출력해. 다른 문구는 절대로 출력하지말고 숫자만 출력해"""},
            {"role": "user", "content": description},
        ],
        stream=False,
        temperature=0
    )

    attrib = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": """지금부터 너한테 몬스터에 대한 설명을 줄건데,
            속성을 불, 물, 번개, 정신, 흙, 얼음, 기계, 빛, 혼돈, 어둠 중에서 하나를 골라서 출력해.
            다른 문구는 출력하지마."""},
            {"role": "user", "content": description},
        ],
        stream=False
    )

    res = str(response.choices[0].message.content)
    attrib = str(attrib.choices[0].message.content).strip()

    res = res.replace("]", "").replace("[", "")
    attack, defence = [int(i) for i in res.split(",")]

    cost = (attack + defence*1.2) ** attribdict[attrib]
    return attrib, attack, defence, int(round(cost/3.8))

# ===== Tkinter GUI =====
cards_raw = []  # (이름, 설명) 저장

def add_card():
    name = entry_name.get().strip()
    desc = text_desc.get("1.0", tk.END).strip()
    if not name or not desc:
        messagebox.showwarning("경고", "카드 이름과 설명을 모두 입력하세요!")
        return
    cards_raw.append((name, desc))
    listbox.insert(tk.END, name)
    entry_name.delete(0, tk.END)
    text_desc.delete("1.0", tk.END)

def finish_build():
    root.destroy()  # mainloop 종료

root = tk.Tk()
root.title("Deck Builder")
root.geometry("480x500")

tk.Label(root, text="카드 이름:").pack(anchor="w", padx=10, pady=2)
entry_name = tk.Entry(root, width=40)
entry_name.pack(padx=10, pady=5)

tk.Label(root, text="카드 설명:").pack(anchor="w", padx=10, pady=2)
text_desc = tk.Text(root, height=5, width=40)
text_desc.pack(padx=10, pady=5)

frame_btn = tk.Frame(root)
frame_btn.pack(pady=5)
tk.Button(frame_btn, text="카드 추가", command=add_card, bg="#4CAF50", fg="white", width=12).grid(row=0, column=0, padx=5)
tk.Button(frame_btn, text="덱 빌딩 완료", command=finish_build, bg="#2196F3", fg="white", width=12).grid(row=0, column=1, padx=5)

tk.Label(root, text="현재 덱:").pack(anchor="w", padx=10, pady=2)
listbox = tk.Listbox(root, width=60, height=15)
listbox.pack(padx=10, pady=10)

root.mainloop()

# ===== 빌딩 종료 후 DeepSeek 호출 & 카드 변환 =====
cards = []
for idx, (name, desc) in enumerate(cards_raw, start=1):
    attrib, attack, defence, cost = get_stat(desc)
    card = Card(id=idx, name=name, cost=cost,
                attack=attack, health=defence, maxHealth=defence,
                attribute=attrib)
    cards.append(card)

# ===== JSON 저장 =====
with open("cards.json", "w", encoding="utf-8") as f:
    json.dump([asdict(c) for c in cards], f, ensure_ascii=False, indent=2)

# JSON 불러오기
with open("cards.json", "r", encoding="utf-8") as f:
    cards = json.load(f)

# TypeScript 카드 타입 정의 + 데이터 변환
ts_lines = []
ts_lines.append("import { Card } from './game';\n")
ts_lines.append("export const cardDatabase: Card[] = [\n")

for c in cards:
    attrib = c['attribute']
   #image = attribute_images.get(attrib, "")
    line = (
        f"  {{ id: '{c['id']}', name: '{c['name']}', cost: {c['cost']}, "
        f"attack: {c['attack']}, health: {c['health']}, maxHealth: {c['maxHealth']}, "
        f"attribute: '{attrib}', image: '/img/{attrib}.png' }},"
    )
    ts_lines.append(line + "\n")

ts_lines.append("];\n")

# TSX 파일로 저장
with open("cardDatabase.ts", "w", encoding="utf-8") as f:
    f.writelines(ts_lines)

print("✅ cardDatabase.ts 저장 완료!")
