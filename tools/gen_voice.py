#!/usr/bin/env python3
"""预生成全部配音 MP3（edge-tts 小晓音色）"""
import asyncio, os
import edge_tts

VOICE = "zh-CN-XiaoxiaoNeural"
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "audio")

LINES = {
    "welcome":    ("哇～欢迎来到宠物小窝！快看，篮子里的小狗都想跟你回家呢！", "+6%", "+10Hz"),
    "pick":       ("摸摸它们，选一只最喜欢的小狗吧！", "+6%", "+10Hz"),
    "adopt_done": ("太好啦！从今天起，它就是你的家人啦！", "+8%", "+15Hz"),
    "home_first": ("这就是你们温暖的小家～摸摸它，它会很开心哦！", "+4%", "+10Hz"),
    "hungry":     ("咕噜咕噜～小肚子在叫啦，我们喂点好吃的吧！", "+6%", "+10Hz"),
    "dirty":      ("身上有点脏脏啦，洗个泡泡澡吧！", "+6%", "+10Hz"),
    "feed_done":  ("吃得真香呀～肚子圆滚滚！", "+6%", "+12Hz"),
    "bath_start": ("哗啦啦～洗澡澡时间到！用手指搓出好多泡泡吧！", "+8%", "+12Hz"),
    "bath_done":  ("哇！香喷喷，亮晶晶！", "+8%", "+15Hz"),
    "brush_start":("在它身上轻轻划一划，给毛毛做个美容吧～", "+4%", "+10Hz"),
    "brush_done": ("毛毛梳得顺顺的，真漂亮！", "+8%", "+12Hz"),
    "stroke1":    ("它喜欢你摸摸它呢～", "+4%", "+10Hz"),
    "sleep":      ("嘘——宝贝要睡觉啦，晚安～", "-12%", "+0Hz"),
    "wake":       ("早上好呀！睡饱饱，精神好！", "+8%", "+15Hz"),
    "shop_open":  ("用小爱心，换温暖的小家具吧！", "+6%", "+10Hz"),
    "placed":     ("放这里真不错！按住它，还可以挪位置哦～", "+6%", "+10Hz"),
    "no_hearts":  ("爱心还差一点点，多陪陪它就有啦！", "+4%", "+10Hz"),
    "play":       ("看！它玩得多开心呀！", "+10%", "+15Hz"),
    "elf1":       ("多陪陪你的小狗狗，爱心就会越来越多哦！", "+6%", "+10Hz"),
    "elf2":       ("攒够爱心，可以给小窝添新家具呀！", "+6%", "+10Hz"),
    "bark":       ("汪汪！", "+25%", "+60Hz"),
    "bark2":      ("汪呜～", "+15%", "+50Hz"),
}

async def gen(name, text, rate, pitch):
    path = os.path.join(OUT, f"{name}.mp3")
    tts = edge_tts.Communicate(text, VOICE, rate=rate, pitch=pitch)
    await tts.save(path)
    print(f"  {name}.mp3  {os.path.getsize(path)//1024}KB")

async def main():
    os.makedirs(OUT, exist_ok=True)
    for name, (text, rate, pitch) in LINES.items():
        for attempt in range(3):
            try:
                await gen(name, text, rate, pitch)
                break
            except Exception as e:
                print(f"  retry {name}: {e}")
                await asyncio.sleep(2)

asyncio.run(main())
