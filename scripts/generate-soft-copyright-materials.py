from __future__ import annotations

import os
from pathlib import Path
from textwrap import wrap

from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "pdf"
SCREENSHOT_DIR = ROOT / "output" / "soft-copyright-screenshots"
REDACTED_SCREENSHOT_DIR = ROOT / "output" / "soft-copyright-screenshots-redacted"
SOFTWARE_NAME = "DPSir智能云网盘软件"
VERSION = "V1.0"

FONT_REGULAR = r"C:\Windows\Fonts\simsun.ttc"
FONT_BOLD = r"C:\Windows\Fonts\simhei.ttf"

SOURCE_FILES = [
    "server.js",
    "public/index.html",
    "public/app.js",
    "public/styles.css",
    "public/cache-cleanup.js",
    "scripts/server-watchdog.js",
    "scripts/render-office-preview.ps1",
    "scripts/office-preview-worker.ps1",
    "scripts/fix-drive-filenames.js",
    "scripts/cloudflared-common.ps1",
    "scripts/start-public-tunnel.ps1",
    "scripts/setup-cloudflare-domain.ps1",
    "scripts/start-cloudflare-domain.ps1",
    "scripts/show-addresses.ps1",
    "scripts/allow-lan-firewall.ps1",
    "scripts/clean-hidden-drive-files.ps1",
    "scripts/install-lan-autostart.ps1",
    "scripts/uninstall-lan-autostart.ps1",
    "scripts/install-cloudflare-autostart.ps1",
    "scripts/uninstall-cloudflare-autostart.ps1",
    "scripts/run-lan-drive-hidden.ps1",
    "scripts/run-cloudflare-domain-hidden.ps1",
    "scripts/run-lan-drive-silent.vbs",
    "scripts/run-cloudflare-domain-silent.vbs",
]

SCREENSHOT_ITEMS = [
    ("01-login.png", "图 1 登录界面", [
        "展示软件启动后的登录入口、软件名称、版本视觉标识和账号密码输入区域。",
        "用户在该界面完成登录、注册账号或找回密码等入口操作。",
    ]),
    ("02-main.png", "图 2 网盘主界面", [
        "展示文件列表、上传入口、新建文件夹、搜索入口、访问状态和存储统计。",
        "截图中的存储路径和访问地址已进行脱敏处理。",
    ]),
    ("03-upload-modal.png", "图 3 上传位置选择界面", [
        "展示用户选择上传位置、选择文件或选择文件夹上传的操作入口。",
        "系统支持将文件上传到当前目录或指定目标目录。",
    ]),
    ("04-search.png", "图 4 关键词搜索界面", [
        "展示按文件名、文件夹名、路径、类型、时间和大小进行检索的结果页面。",
        "用户可从搜索结果中继续预览、下载或进入文件夹。",
    ]),
    ("05-preview.png", "图 5 文件预览界面", [
        "展示文件预览弹窗和下载入口，用户可在浏览器内查看支持的文件内容。",
        "无法直接预览的文件类型可通过下载方式在本地打开。",
    ]),
    ("06-ai-global.png", "图 6 AI 全库问答界面", [
        "展示 AI 全库问答侧边面板，系统围绕当前目录的文件名、路径和结构进行问答。",
        "用户可通过快捷提示词或输入框提出资料整理、查找和分析问题。",
    ]),
    ("07-ai-answer.png", "图 7 AI 回答与结果卡片界面", [
        "展示 AI 返回的回答、相关文件卡片、预览入口和单文件 AI 对话入口。",
        "该功能用于提升资料定位、摘要提取和智能分析效率。",
    ]),
    ("08-ai-file.png", "图 8 单文件 AI 对话界面", [
        "展示围绕单个文件或文件夹开展 AI 对话的界面。",
        "系统会根据文件可读取内容或元数据生成摘要、重点和说明。",
    ]),
    ("09-folder-password.png", "图 9 文件夹密码保护界面", [
        "展示文件夹加密、密码设置和访问保护相关操作。",
        "系统在设置或修改密码时会进行身份和权限校验。",
    ]),
]

INTERLEAVED_SECTIONS = [
    {
        "title": "一、登录与账号管理",
        "image": "01-login.png",
        "caption": "图 1 登录界面",
        "purpose": "提供软件访问入口，完成用户身份识别，并区分不同账号的个人存储空间。",
        "entry": "用户通过浏览器打开网盘访问地址后进入登录界面。",
        "steps": [
            "输入账号和密码，点击登录按钮进入网盘主界面。",
            "新用户可点击注册账号，填写账号和密码后创建独立账号。",
            "忘记密码时，可进入找回密码流程，通过管理员或本机恢复密码重置新密码。",
            "登录成功后，系统保存会话令牌；退出登录后清除会话并返回登录界面。",
        ],
        "result": "登录成功后进入当前账号的个人云端资料库，注册账号会生成独立存储目录。",
        "exception": "账号或密码错误、账号重复、密码为空或恢复密码错误时，系统会显示中文提示并停止后续操作。",
    },
    {
        "title": "二、网盘首页与目录浏览",
        "image": "02-main.png",
        "caption": "图 2 网盘主界面",
        "purpose": "集中展示文件夹、文件、路径导航、访问状态、存储空间和常用操作入口。",
        "entry": "用户登录成功后默认进入网盘主界面。",
        "steps": [
            "通过文件列表查看当前目录下的文件夹和文件。",
            "点击文件夹名称进入下一级目录，点击返回按钮或面包屑路径切换目录。",
            "通过上传文件、新建文件夹、多选和刷新按钮执行常用管理操作。",
            "通过左侧信息区查看本机访问、局域网访问、公网访问和服务状态。",
        ],
        "result": "用户能够快速定位当前目录内容，并了解系统运行、存储容量和访问方式。",
        "exception": "目录不存在、路径无权限或服务状态异常时，系统会保留页面并显示提示信息。",
    },
    {
        "title": "三、上传文件与新建文件夹",
        "image": "03-upload-modal.png",
        "caption": "图 3 上传位置选择界面",
        "purpose": "将本地资料保存到个人网盘，并支持按目录进行资料分类管理。",
        "entry": "主界面右上角的上传文件按钮、新建文件夹按钮和拖拽上传区域。",
        "steps": [
            "点击上传文件后选择上传位置，可选择当前目录或其他目标文件夹。",
            "点击选择文件上传单个或多个文件，点击选择文件夹可批量上传目录内容。",
            "也可以将本地文件拖拽到页面，系统自动上传到当前目录。",
            "点击新建文件夹后输入文件夹名称，可选择是否设置文件夹密码。",
        ],
        "result": "上传完成后文件出现在目标目录，文件夹创建后可继续进入、加密或管理。",
        "exception": "文件过大、数量超限、目标路径无效、同名冲突或网络中断时，系统会提示用户重新处理。",
    },
    {
        "title": "四、关键词搜索与结果定位",
        "image": "04-search.png",
        "caption": "图 4 关键词搜索界面",
        "purpose": "根据关键词快速查找文件名、文件夹名、路径、类型、日期或大小等信息。",
        "entry": "主界面搜索框、搜索按钮、清除搜索按钮、分类标签和排序控件。",
        "steps": [
            "输入关键词后点击搜索，系统在当前账号目录范围内扫描匹配项。",
            "搜索结果会显示匹配文件和文件夹，并标明路径、类型、大小及修改时间。",
            "用户可按类型分类查看结果，也可按相关性、名称、时间或大小排序。",
            "搜索结果中的文件仍可继续预览、下载或进入单文件 AI 对话。",
        ],
        "result": "用户可在大量个人资料中快速定位目标文件和相关目录。",
        "exception": "关键词为空、目录不可访问或文件已被删除时，系统会提示刷新或重新输入。",
    },
    {
        "title": "五、文件预览与下载",
        "image": "05-preview.png",
        "caption": "图 5 文件预览界面",
        "purpose": "在浏览器中查看常见文件内容，并提供单文件下载入口。",
        "entry": "文件名称、预览按钮、文件预览弹窗和下载按钮。",
        "steps": [
            "点击文件名或预览按钮打开预览弹窗。",
            "图片、视频、音频、文本、PDF、Word、PPT 和表格文件会按类型展示。",
            "表格、PPT、Word 等大文件仅展示适合浏览器查看的部分内容。",
            "点击下载按钮可将文件保存到本地；批量下载会生成压缩包。",
        ],
        "result": "用户无需离开浏览器即可快速查看文件内容，并在需要时下载原文件。",
        "exception": "文件类型不支持、文件过大、预览转换失败或文件不存在时，系统会提示下载或刷新。",
    },
    {
        "title": "六、AI 全库问答入口",
        "image": "06-ai-global.png",
        "caption": "图 6 AI 全库问答界面",
        "purpose": "围绕当前目录和文件结构进行资料查找、整理和语义问答。",
        "entry": "主界面 AI 模式按钮和 AI 全库问答按钮。",
        "steps": [
            "点击 AI 模式后，列表中显示文件和文件夹的 AI 对话入口。",
            "点击 AI 全库问答打开侧边对话面板，系统以当前目录为问答范围。",
            "用户可使用快捷提示词，也可在输入框中提出自定义问题。",
            "系统会实时读取文件名、路径、类型、大小、修改时间和目录结构作为上下文。",
        ],
        "result": "AI 会根据当前资料范围回答问题，并在需要时给出相关文件结果卡片。",
        "exception": "如果问题需要具体文件正文而当前上下文未提供正文，AI 会提示进入单文件对话继续查看。",
    },
    {
        "title": "七、AI 回答与结果卡片",
        "image": "07-ai-answer.png",
        "caption": "图 7 AI 回答与结果卡片界面",
        "purpose": "将 AI 回答、资料定位结果和后续操作入口集中呈现。",
        "entry": "AI 全库问答发送问题后的回答区域。",
        "steps": [
            "用户提交问题后，系统显示分析中状态并等待 AI 返回。",
            "AI 回答支持 Markdown、列表、代码片段和数学公式展示。",
            "与问题相关的文件会以结果卡片形式出现，卡片包含文件名、大小和匹配原因。",
            "用户可从结果卡片继续预览、下载或进入单文件 AI 对话。",
        ],
        "result": "用户可以从回答直接跳转到相关资料，减少重复搜索和手动定位时间。",
        "exception": "AI Key 缺失、无效、额度不足、限流、超时或服务不可用时，系统会显示明确原因和处理建议。",
    },
    {
        "title": "八、单文件 AI 对话",
        "image": "08-ai-file.png",
        "caption": "图 8 单文件 AI 对话界面",
        "purpose": "针对单个文件或文件夹进行摘要、重点提取、提纲生成、代码解释和内容分析。",
        "entry": "文件行或 AI 结果卡片中的 AI 对话按钮。",
        "steps": [
            "点击某个文件的 AI 对话按钮后，系统切换为单文件问答模式。",
            "系统根据文件类型提取文本、表格、PPT、PDF、图片 OCR 或元数据信息。",
            "用户可要求 AI 总结文件、提取重点、生成汇报提纲或解释代码逻辑。",
            "对于文件夹对象，系统会读取文件夹直属内容并整理目录结构。",
        ],
        "result": "AI 的回答更聚焦当前文件或文件夹，适合精读、整理和连续追问。",
        "exception": "无法提取正文的文件会基于文件名、路径、大小和修改时间回答；加密目录未解锁时不会读取内部内容。",
    },
    {
        "title": "九、文件夹密码保护",
        "image": "09-folder-password.png",
        "caption": "图 9 文件夹密码保护界面",
        "purpose": "为敏感文件夹设置独立密码，保护目录进入、下载和删除等关键操作。",
        "entry": "文件夹行中的加密、修改密码、取消密码、忘记密码等操作入口。",
        "steps": [
            "创建或管理文件夹时，可为文件夹设置访问密码。",
            "进入加密文件夹、下载加密文件夹内容或删除加密文件夹时需要验证密码。",
            "修改或取消文件夹密码时，需要验证网盘登录密码和当前文件夹密码。",
            "忘记文件夹密码时，可使用网盘登录密码重置或清除文件夹密码。",
        ],
        "result": "重要资料目录获得独立访问保护，同时保留可恢复的密码管理流程。",
        "exception": "密码错误、登录密码错误或权限不足时，系统拒绝继续执行并给出中文提示。",
    },
    {
        "title": "十、批量管理与安全控制",
        "image": "02-main.png",
        "caption": "图 10 文件列表与批量操作入口",
        "purpose": "支持多选文件或文件夹后统一下载、复制、移动和删除，并保证操作安全。",
        "entry": "主界面多选按钮、文件行复选框、批量操作栏和更多操作按钮。",
        "steps": [
            "点击多选后勾选一个或多个文件、文件夹。",
            "点击批量下载可生成压缩包，点击批量复制或移动可选择目标目录。",
            "点击批量删除前系统会要求确认，减少误操作风险。",
            "所有操作均由服务端进行路径校验、账号校验和权限校验。",
        ],
        "result": "用户可以高效处理多个资料项，并保持账号隔离和路径安全。",
        "exception": "选择为空、目标目录无效、同名冲突或试图移动到自身子目录时，系统会阻止操作。",
    },
    {
        "title": "十一、服务状态与运行维护",
        "image": "02-main.png",
        "caption": "图 11 服务状态与存储统计区域",
        "purpose": "帮助用户了解网盘服务、存储空间、访问地址和运行状态。",
        "entry": "左侧服务状态、存储空间、访问地址区域，以及启动脚本和守护脚本。",
        "steps": [
            "系统启动后显示本机访问地址、局域网访问地址和公网备用地址。",
            "服务状态区域检查本机服务、存储目录、公网访问和账号隔离情况。",
            "存储统计区域显示当前账号已用空间和磁盘可用空间。",
            "管理员可通过启动脚本、局域网脚本或 Cloudflare 隧道脚本维护访问方式。",
        ],
        "result": "用户可及时了解服务可用性和存储情况，管理员可按需维护部署环境。",
        "exception": "公网不可达、存储统计失败或局域网地址变化时，系统会显示提示但不阻塞本地文件管理。",
    },
]


def register_fonts() -> tuple[str, str]:
    pdfmetrics.registerFont(TTFont("SoftCopyrightSong", FONT_REGULAR))
    pdfmetrics.registerFont(TTFont("SoftCopyrightHei", FONT_BOLD))
    return "SoftCopyrightSong", "SoftCopyrightHei"


def clean_line(line: str) -> str:
    line = line.rstrip("\r\n")
    line = line.replace("\ufeff", "")
    line = line.replace("\x00", "")
    line = line.replace("\t", "    ")
    return line


def read_source_lines() -> list[str]:
    lines: list[str] = []
    for rel in SOURCE_FILES:
        path = ROOT / rel
        if not path.exists():
            continue
        lines.append(f"// ===== File: {rel.replace(os.sep, '/')} =====")
        text = path.read_text(encoding="utf-8", errors="replace")
        for raw in text.splitlines():
            line = clean_line(raw)
            if line.strip():
                lines.append(line)
    return lines


def wrap_code_line(line_no: int | None, text: str, max_chars: int = 118) -> list[str]:
    prefix = f"{line_no:04d}  " if line_no is not None else "      "
    continuation = "      | "
    available = max_chars - len(prefix)
    chunks = wrap(text, width=available, break_long_words=True, break_on_hyphens=False, replace_whitespace=False)
    if not chunks:
        chunks = [""]
    result = [f"{prefix}{chunks[0]}"]
    continuation_width = max_chars - len(continuation)
    for chunk in chunks[1:]:
        for part in wrap(chunk, width=continuation_width, break_long_words=True, break_on_hyphens=False, replace_whitespace=False) or [""]:
            result.append(f"{continuation}{part}")
    return result


def paginate_code_lines(source_lines: list[str], lines_per_page: int = 50) -> list[list[str]]:
    rendered: list[str] = []
    for source_no, text in enumerate(source_lines, start=1):
        rendered.extend(wrap_code_line(source_no, text))
    return [rendered[index : index + lines_per_page] for index in range(0, len(rendered), lines_per_page)]


def draw_header_footer(
    pdf: canvas.Canvas,
    title: str,
    page_no: int,
    total_pages: int,
    regular_font: str,
    bold_font: str,
) -> None:
    width, height = A4
    pdf.setFont(bold_font, 10.5)
    pdf.drawString(42, height - 34, f"{SOFTWARE_NAME} {VERSION}")
    pdf.drawRightString(width - 42, height - 34, title)
    pdf.setLineWidth(0.4)
    pdf.line(42, height - 43, width - 42, height - 43)
    pdf.setFont(regular_font, 9)
    pdf.drawRightString(width - 42, 28, f"第 {page_no} 页 / 共 {total_pages} 页")


def write_source_pdf(output_path: Path, regular_font: str, bold_font: str) -> None:
    all_lines = read_source_lines()
    lines_per_page = 50
    all_pages = paginate_code_lines(all_lines, lines_per_page)
    if len(all_pages) <= 60:
        pages = all_pages
    else:
        rendered_lines = [line for page in all_pages for line in page]
        required_lines = lines_per_page * 60
        selected_lines = rendered_lines[: lines_per_page * 30] + rendered_lines[-lines_per_page * 30 :]
        pages = [selected_lines[index : index + lines_per_page] for index in range(0, required_lines, lines_per_page)]

    total_pages = len(pages)
    pdf = canvas.Canvas(str(output_path), pagesize=A4)
    width, height = A4
    left = 42
    top = height - 58
    line_height = 13.4

    for page_index, page_lines in enumerate(pages):
        draw_header_footer(pdf, "程序鉴别材料", page_index + 1, total_pages, regular_font, bold_font)
        pdf.setFont(regular_font, 7.5)
        for row, text in enumerate(page_lines, start=1):
            pdf.drawString(left, top - (row - 1) * line_height, text)
        pdf.showPage()
    pdf.save()


def write_full_source_pdf(output_path: Path, regular_font: str, bold_font: str) -> None:
    source_lines = read_source_lines()
    lines_per_page = 50
    pages = paginate_code_lines(source_lines, lines_per_page)
    pdf = canvas.Canvas(str(output_path), pagesize=A4)
    width, height = A4
    left = 42
    top = height - 58
    line_height = 13.4
    total_pages = len(pages)

    for page_index, page_lines in enumerate(pages):
        draw_header_footer(pdf, "完整源代码材料", page_index + 1, total_pages, regular_font, bold_font)
        pdf.setFont(regular_font, 7.5)
        for row, text in enumerate(page_lines, start=1):
            pdf.drawString(left, top - (row - 1) * line_height, text)
        pdf.showPage()
    pdf.save()


MANUAL_SECTIONS = [
    ("一、软件概述", [
        "本软件名称为 DPSir智能云网盘软件，版本号为 V1.0，是面向个人资料集中存储、检索、预览和智能问答的云网盘系统。",
        "系统以浏览器为主要操作入口，用户可在本机、局域网或配置后的公网地址访问个人云端资料库。",
        "软件提供账号登录、文件上传、文件下载、文件预览、目录管理、关键词搜索、批量操作、文件夹加密和 AI 问答等功能。",
        "系统接入 DeepSeek AI 大模型能力，支持围绕当前目录进行全库问答，也支持针对单个文件或文件夹进行内容分析。",
        "软件适用于个人学习资料、项目文档、论文材料、图片音视频、表格和日常文件的集中管理。",
    ]),
    ("二、运行环境", [
        "服务器端运行环境为 Windows 10 及以上操作系统，建议安装 Node.js 运行环境并保持可用的本地磁盘空间。",
        "客户端通过 Chrome、Edge 等现代浏览器访问，无需单独安装客户端程序。",
        "软件可在本机地址、局域网地址或公网域名下访问，具体地址由服务启动时自动检测或由管理员配置。",
        "如需使用 AI 问答能力，需要在服务器环境变量中配置有效的 DeepSeek API Key。",
        "如需使用 Office 预览、图片 OCR 等扩展能力，需要保证相关运行组件和字体资源可正常访问。",
    ]),
    ("三、账号登录", [
        "用户打开系统首页后进入登录界面，输入账号和密码即可进入个人网盘空间。",
        "系统支持用户注册功能，新用户可按页面提示创建账号并获得独立的存储目录。",
        "登录成功后，系统会保存会话令牌，刷新页面后可继续识别当前用户身份。",
        "若用户忘记登录密码，可使用找回密码功能，通过管理员或本机恢复密码完成新密码设置。",
        "退出登录后，系统会清除当前会话并返回登录界面。",
    ]),
    ("四、首页与导航", [
        "进入网盘后，左侧显示软件标识、存储目录、访问地址、服务状态和存储空间信息。",
        "主区域显示当前文件夹的路径面包屑、搜索工具、上传入口、新建文件夹入口和文件列表。",
        "用户可通过返回按钮或面包屑路径在不同文件夹之间切换。",
        "文件列表按文件夹和文件展示名称、类型、大小、修改时间及可执行操作。",
        "当文件夹为空时，系统会显示空状态提示，引导用户上传文件或新建文件夹。",
    ]),
    ("五、文件上传", [
        "用户点击上传文件按钮后，可选择上传到当前文件夹或其他目标文件夹。",
        "系统支持选择单个文件、多个文件，也支持选择整个文件夹进行批量上传。",
        "用户也可以将本地文件拖拽到页面指定区域，系统会自动上传到当前文件夹。",
        "上传过程中页面会显示进度、文件数量和完成状态，方便用户了解上传进展。",
        "系统对单个文件大小和一次上传数量设置限制，超过限制时会给出明确提示。",
    ]),
    ("六、文件下载", [
        "用户可在文件列表中点击下载按钮下载单个文件。",
        "用户进入选择模式后，可勾选多个文件或文件夹并执行批量下载。",
        "批量下载时系统会将选中的文件打包为压缩包，浏览器自动保存到本地。",
        "对于加密文件夹内的文件，系统会在下载前要求用户输入文件夹密码。",
        "下载链接带有临时校验令牌，避免未授权用户直接复用下载地址。",
    ]),
    ("七、文件预览", [
        "系统支持常见图片、视频、音频、文本、PDF、表格、Word 和 PPT 文件的在线预览。",
        "用户点击文件名或预览按钮后，系统会打开预览弹窗展示文件内容。",
        "图片预览支持左右切换同目录下的图片文件，便于连续浏览。",
        "表格预览会展示前若干行列数据，并提示完整内容可下载后查看。",
        "对于无法直接预览的文件类型，系统会提示用户通过下载方式在本地打开。",
    ]),
    ("八、目录管理", [
        "用户可在当前目录中新建文件夹，并可选择是否为文件夹设置访问密码。",
        "系统支持文件和文件夹的重命名、复制、移动和删除操作。",
        "复制或移动时，用户可从目录选择器中选择目标文件夹。",
        "系统会校验同名文件、非法路径和目录循环移动等异常情况，并给出提示。",
        "删除前系统会弹出确认窗口，降低误删风险。",
    ]),
    ("九、文件夹密码保护", [
        "用户可为重要文件夹设置独立密码，进入或下载其中内容时需要验证。",
        "设置文件夹密码时，需要先验证网盘登录密码，防止他人擅自加密目录。",
        "已加密文件夹支持修改密码、取消密码和忘记密码后的重置流程。",
        "删除加密文件夹前，系统会要求同时验证网盘登录密码和当前文件夹密码。",
        "系统不会明文展示旧密码，只允许通过验证后重新设置或清除。",
    ]),
    ("十、关键词搜索", [
        "用户可在搜索框中输入关键词，搜索当前账号目录下的文件名、文件夹名、路径、类型、日期或大小。",
        "搜索结果会按照文件类型进行分类展示，支持按相关性、名称、时间和大小排序。",
        "搜索结果中会高亮匹配关键词，帮助用户快速确认匹配原因。",
        "用户可在搜索结果中直接预览、下载或进入对应文件夹。",
        "搜索范围以当前目录为起点，避免跨用户或跨权限目录泄露数据。",
    ]),
    ("十一、AI 模式", [
        "用户点击 AI 模式按钮后，文件列表中会显示每个项目的 AI 对话入口。",
        "AI 模式默认不持久保存，用户每次进入系统后可按需开启。",
        "点击 AI 全库问答后，系统会打开侧边 AI 对话面板，围绕当前目录进行资料定位和问题回答。",
        "点击单个文件或文件夹的 AI 对话后，系统会围绕该对象构建上下文并回答用户问题。",
        "AI 对话会保留当前会话中的历史消息，便于用户连续追问。",
    ]),
    ("十二、AI 全库问答", [
        "全库问答会读取当前目录的文件名、路径、类型、大小、修改时间和目录结构。",
        "当用户询问某类文件、某个资料位置或当前目录内容时，系统会返回文本回答和可点击结果卡片。",
        "结果卡片支持预览、进入文件夹或切换到单文件 AI 对话。",
        "如果用户的问题需要具体文件正文，而当前全库上下文没有正文内容，AI 会提示进入单文件对话查看。",
        "全库问答每次请求都会重新读取服务端目录状态，保证新建、删除和移动后的结果及时更新。",
    ]),
    ("十三、单文件 AI 对话", [
        "单文件 AI 对话会根据文件类型尝试提取可读取文本内容。",
        "对于文本、Markdown、代码、PDF、Word、PPT、表格和部分图片，系统会尽量提取正文或可识别内容。",
        "用户可以要求 AI 总结文件、提取重点、生成提纲、解释代码或分析表格。",
        "对于暂时无法提取正文的文件，AI 会基于文件名、路径、大小和修改时间进行说明。",
        "单文件对话遵守文件夹权限控制，未解锁的加密文件夹内容不会被读取。",
    ]),
    ("十四、AI 联网搜索", [
        "系统提供联网搜索开关，用户开启后可让 AI 根据问题自行判断是否需要联网检索。",
        "联网搜索主要用于外部事实、实时信息和需要核验的内容。",
        "联网结果会在回答中显示来源信息，包括链接标题、地址和摘要。",
        "网页内容仅作为参考资料来源，不能覆盖系统权限、用户真实意图和本地网盘上下文。",
        "当联网搜索失败或超时时，系统会给出错误提示，用户可稍后重试或关闭联网搜索。",
    ]),
    ("十五、服务状态与访问地址", [
        "系统会显示当前访问方式，包括本机访问、局域网访问或公网访问。",
        "局域网地址由服务器根据网卡信息自动检测并展示。",
        "公网地址可通过配置 Cloudflare Tunnel 或其他公网访问方式实现。",
        "服务状态会检查本机服务、存储目录、公网地址和账号隔离情况。",
        "当服务检测发现异常时，页面会显示需要注意的状态信息。",
    ]),
    ("十六、存储空间统计", [
        "系统会周期性统计当前网盘已使用空间。",
        "当磁盘可用容量可以获取时，页面会同时显示已用空间和可用空间。",
        "上传、删除、移动等操作完成后，系统会触发存储统计刷新。",
        "存储信息仅用于提示用户当前空间使用情况，不会改变文件内容。",
        "当统计失败时，系统会保持已有界面状态，不影响用户继续使用核心功能。",
    ]),
    ("十七、安全控制", [
        "系统通过账号会话和服务端接口校验控制用户访问。",
        "每个普通用户拥有独立存储目录，避免不同账号之间的数据混用。",
        "服务端会校验路径，防止访问隐藏目录、缓存目录或越权路径。",
        "文件夹密码以加密摘要方式存储，不在页面中明文展示。",
        "下载、预览、AI 读取等接口均会在服务端进行权限判断。",
    ]),
    ("十八、异常提示", [
        "系统对上传失败、下载失败、预览失败、密码错误和网络中断等情况提供中文提示。",
        "AI 调用失败时，系统会区分 API Key 缺失、无效、额度不足、限流、超时和服务不可用等情况。",
        "当 DeepSeek 服务暂时不可用或网络异常时，系统会进行有限重试并返回可操作提示。",
        "当文件不存在或路径无权限时，系统会提示用户刷新页面或检查目录权限。",
        "异常处理不会暴露敏感内部信息，用户只看到必要的操作建议。",
    ]),
    ("十九、典型使用流程", [
        "用户首先通过浏览器打开网盘地址，输入账号和密码完成登录。",
        "登录后用户可新建文件夹，将本地资料上传到对应目录。",
        "用户可通过关键词搜索查找文件，也可通过目录逐级浏览。",
        "需要查看内容时，用户可直接预览支持的文件类型。",
        "需要智能整理资料时，用户可开启 AI 模式并使用全库问答或单文件对话。",
    ]),
    ("二十、维护与备份", [
        "管理员可通过启动脚本运行网盘服务，也可通过守护脚本保持服务自动运行。",
        "用户数据保存在配置的存储根目录下，建议定期备份该目录。",
        "系统产生的预览缓存和临时文件可由内置清理逻辑维护。",
        "如需更换公网访问方式，可更新相关隧道配置或启动脚本。",
        "如需调整 AI 模型、超时时间或上下文长度，可通过服务器环境变量配置。",
    ]),
]

DETAILED_MODULES = [
    ("登录模块", "完成用户身份验证", "登录界面", "进入个人网盘首页", "账号或密码错误时重新输入"),
    ("注册模块", "创建新的个人网盘账号", "登录界面的注册入口", "生成独立用户存储目录", "密码不能为空且账号不能重复"),
    ("找回密码模块", "使用管理员恢复密码重置用户密码", "找回密码弹窗", "用户可使用新密码登录", "不会显示或找回旧密码"),
    ("会话管理模块", "保持浏览器访问状态", "登录成功后的会话令牌", "刷新页面后识别当前账号", "退出登录会清除会话"),
    ("目录展示模块", "展示当前文件夹内容", "网盘主界面文件列表", "显示名称、类型、大小和修改时间", "隐藏系统缓存和临时目录"),
    ("路径导航模块", "在多级文件夹之间切换", "面包屑路径和返回按钮", "进入目标目录并刷新列表", "无权限路径会被拒绝"),
    ("新建文件夹模块", "创建新的资料分类目录", "新建文件夹按钮", "当前目录下新增文件夹", "同名目录会提示冲突"),
    ("文件上传模块", "上传本地文件到网盘", "上传文件按钮", "文件保存到指定目录", "超过大小或数量限制会提示"),
    ("文件夹上传模块", "批量上传本地文件夹", "选择文件夹按钮", "保持相对目录结构上传", "空文件夹不会单独生成内容"),
    ("拖拽上传模块", "通过拖拽完成快速上传", "浏览器拖拽区域", "文件自动上传到当前目录", "非文件拖拽不会触发上传"),
    ("上传进度模块", "展示上传状态和完成进度", "上传任务进行中", "显示文件数量和百分比", "网络中断会提示重试"),
    ("单文件下载模块", "下载选中的单个文件", "文件行下载按钮", "浏览器保存文件", "加密目录内文件需验证密码"),
    ("批量下载模块", "一次下载多个文件和文件夹", "选择模式下的批量下载按钮", "生成压缩包并下载", "一次选择数量受限制"),
    ("图片预览模块", "在线查看图片内容", "文件名或预览按钮", "弹窗展示图片并支持切换", "完整原图可通过下载获得"),
    ("视频预览模块", "在线播放视频文件", "视频文件预览入口", "浏览器播放支持的格式", "不支持格式需下载查看"),
    ("音频预览模块", "在线播放音频文件", "音频文件预览入口", "浏览器播放音频内容", "不支持格式需下载查看"),
    ("文本预览模块", "在线查看文本和代码片段", "文本类文件预览入口", "弹窗展示文本内容", "超大文件仅展示可读取部分"),
    ("PDF预览模块", "在线查看 PDF 文件", "PDF 文件预览入口", "嵌入式预览页面显示内容", "浏览器能力会影响显示效果"),
    ("表格预览模块", "查看 Excel 或 CSV 数据", "表格文件预览入口", "展示工作表、行列和数据片段", "完整数据需下载查看"),
    ("Word预览模块", "查看文档类文件内容", "Word 文件预览入口", "转换为可浏览页面或文本", "转换失败时提示下载"),
    ("PPT预览模块", "查看演示文稿内容", "PPT 文件预览入口", "展示幻灯片文字或布局预览", "复杂动画不作为预览内容"),
    ("重命名模块", "修改文件或文件夹名称", "文件行更多操作", "目标项目名称更新", "非法名称或重名会被拦截"),
    ("复制模块", "复制文件或文件夹到目标目录", "复制操作弹窗", "目标目录生成副本", "不能复制到无效目录"),
    ("移动模块", "移动文件或文件夹到目标目录", "移动操作弹窗", "源路径迁移到目标位置", "不能移动到自身子目录"),
    ("删除模块", "删除不再需要的文件或文件夹", "删除确认弹窗", "目标项目从列表移除", "删除前需确认操作"),
    ("选择模式模块", "支持多选和批量处理", "选择模式按钮", "勾选多个项目后执行批量命令", "清除选择会退出当前勾选状态"),
    ("文件夹加密模块", "为敏感目录设置访问密码", "文件夹加密按钮", "进入和下载时要求密码", "设置时需验证网盘登录密码"),
    ("密码修改模块", "修改已有文件夹密码", "修改密码入口", "新密码替换旧密码", "需验证登录密码和旧文件夹密码"),
    ("忘记文件夹密码模块", "通过登录密码重置文件夹密码", "忘记密码入口", "重新设置或清除文件夹密码", "旧密码不会被显示"),
    ("关键词搜索模块", "通过关键词定位资料", "搜索输入框", "返回匹配文件和文件夹", "搜索范围从当前目录开始"),
    ("搜索分类模块", "按类型整理搜索结果", "搜索结果分类标签", "显示文档、表格、图片等分类", "分类仅影响展示不改变文件"),
    ("搜索排序模块", "调整搜索结果排列方式", "排序下拉框", "按相关性、名称、时间或大小排序", "排序不会改变实际文件位置"),
    ("AI模式入口模块", "开启文件行 AI 对话入口", "AI模式按钮", "列表显示 AI 对话按钮", "刷新后默认关闭以减少干扰"),
    ("AI全库问答模块", "围绕当前目录进行智能问答", "AI全库问答按钮", "返回回答和相关文件卡片", "不直接编造未读取正文"),
    ("AI单文件对话模块", "围绕单个文件分析内容", "文件行 AI 对话按钮", "返回摘要、重点或解释", "不可读取正文时会说明限制"),
    ("AI文件夹对话模块", "分析文件夹内资料结构", "文件夹 AI 对话按钮", "返回目录概览和相关项目", "加密目录需先解锁"),
    ("AI结果卡片模块", "把相关文件转化为可点击结果", "AI回答下方卡片区域", "可预览、进入或继续对话", "卡片只展示有权限的项目"),
    ("AI联网搜索模块", "在需要时补充外部信息", "联网搜索开关", "回答中展示联网来源", "网页内容不能覆盖本地权限规则"),
    ("AI错误提示模块", "分类展示 AI 调用异常", "AI请求失败时", "提示密钥、额度、限流、超时等原因", "用户可按提示处理后重试"),
    ("AI数学渲染模块", "展示回答中的数学公式", "AI Markdown 内容区域", "公式以清晰格式显示", "渲染失败时回退文本"),
    ("Markdown渲染模块", "展示结构化 AI 回答", "AI消息区域", "支持标题、列表、代码和引用", "内容会经过安全清理"),
    ("访问地址模块", "显示本机、局域网和公网地址", "侧边栏访问信息", "用户按环境选择访问入口", "公网地址需提前配置"),
    ("服务健康模块", "检查系统运行状态", "服务状态区域", "显示正常或需要注意", "异常时不影响已可用功能"),
    ("存储统计模块", "显示网盘空间使用情况", "侧边栏存储信息", "展示已用空间和可用空间", "统计失败不阻塞文件操作"),
    ("实时刷新模块", "在文件变化后更新列表", "服务端事件通道", "自动刷新当前目录", "短时间批量操作会适当合并刷新"),
    ("缓存清理模块", "清理预览和历史缓存", "系统后台清理流程", "释放临时文件空间", "不会删除用户正式文件"),
    ("账号隔离模块", "保证不同用户数据隔离", "服务端路径解析", "每个账号访问独立目录", "接口会校验当前用户身份"),
    ("安全下载模块", "避免下载地址被长期复用", "下载链接生成接口", "带令牌的短期下载链接", "过期或不匹配会拒绝下载"),
    ("路径保护模块", "防止越权访问系统文件", "所有文件接口", "只允许访问网盘存储目录", "隐藏目录和非法路径会被拒绝"),
    ("启动维护模块", "启动和维护网盘服务", "启动脚本或 Node.js 命令", "服务监听指定端口", "端口和存储路径可配置"),
]


def manual_lines() -> list[str]:
    lines: list[str] = []
    lines.append(f"{SOFTWARE_NAME}{VERSION}用户操作说明书")
    lines.append("本文档用于说明软件运行环境、主要功能、操作流程、AI 问答能力和系统维护方式。")
    lines.append("用户可依据本文档完成登录、上传、检索、预览、下载、目录管理和智能问答等操作。")
    lines.append(" ")
    for title, paragraphs in MANUAL_SECTIONS:
        lines.append(title)
        for paragraph in paragraphs:
            for part in wrap(paragraph, width=36, break_long_words=False, replace_whitespace=False):
                lines.append(part)
        lines.append(" ")

    tail = [
        ("二十一、注意事项", [
            "用户应妥善保管账号密码、文件夹密码和 AI API Key 等敏感信息。",
            "公网访问开启后，应注意网络环境安全，避免将访问地址泄露给无关人员。",
            "大文件上传和 Office 预览可能受网络、磁盘、浏览器和本机组件影响。",
            "AI 生成内容仅作为辅助参考，重要结论仍应由用户结合原始文件确认。",
            "当软件升级或迁移时，应先备份存储目录和配置文件。",
        ]),
        ("二十二、文档结论", [
            "DPSir智能云网盘软件围绕个人资料管理场景设计，兼顾本地存储、网络访问和 AI 智能分析能力。",
            "软件通过浏览器界面完成主要操作，降低了个人用户部署和使用门槛。",
            "系统在文件权限、路径校验、错误提示和服务状态检测方面提供稳定保障。",
            "AI 全库问答和单文件对话提升了资料定位、内容理解和知识整理效率。",
            "本文档所述功能与 DPSir智能云网盘软件 V1.0 版本相对应。",
        ]),
    ]
    for title, paragraphs in tail:
        lines.append(title)
        for paragraph in paragraphs:
            for part in wrap(paragraph, width=36, break_long_words=False, replace_whitespace=False):
                lines.append(part)
        lines.append(" ")

    lines.append("二十三、详细功能操作说明")
    for index, (module, purpose, entry, result, caution) in enumerate(DETAILED_MODULES, start=1):
        lines.append(f"{index}. {module}")
        lines.append(f"功能目标：{purpose}。")
        lines.append(f"操作入口：{entry}。")
        lines.append(f"执行结果：{result}。")
        lines.append(f"注意事项：{caution}。")
        lines.append("操作步骤一：用户进入对应界面或点击对应按钮。")
        lines.append("操作步骤二：系统展示输入框、选择器、弹窗或操作区域。")
        lines.append("操作步骤三：用户根据页面提示输入信息或选择目标对象。")
        lines.append("操作步骤四：系统在服务端校验账号、路径、权限和参数。")
        lines.append("操作步骤五：校验通过后执行文件、目录、预览、搜索或 AI 请求。")
        lines.append("操作步骤六：系统把处理结果返回到浏览器界面。")
        lines.append("操作步骤七：页面刷新状态、结果列表、弹窗内容或提示信息。")
        lines.append("异常处理一：输入为空、格式错误或路径无效时提示重新操作。")
        lines.append("异常处理二：权限不足、密码错误或文件不存在时拒绝继续执行。")
        lines.append("异常处理三：网络中断或服务异常时显示中文错误提示。")
        lines.append("安全要求一：所有关键操作均以当前登录用户身份为准。")
        lines.append("安全要求二：不允许通过前端参数绕过服务端权限校验。")
        lines.append("用户效果：完成操作后，用户可以继续浏览、管理或分析资料。")
        lines.append(" ")
    compact_lines = [line for line in lines if line.strip()]
    lines_per_page = 32
    remainder = len(compact_lines) % lines_per_page
    if remainder:
        padding_count = lines_per_page - remainder
        for index in range(1, padding_count + 1):
            compact_lines.append(f"附录说明：本文档功能说明与软件 V1.0 版本一致，补充说明第 {index} 项。")
    return compact_lines


def write_manual_pdf(output_path: Path, regular_font: str, bold_font: str) -> None:
    lines = manual_lines()
    lines_per_page = 32
    total_pages = (len(lines) + lines_per_page - 1) // lines_per_page
    pdf = canvas.Canvas(str(output_path), pagesize=A4)
    width, height = A4
    left = 56
    top = height - 62
    line_height = 21

    for page_index in range(total_pages):
        draw_header_footer(pdf, "文档鉴别材料", page_index + 1, total_pages, regular_font, bold_font)
        page_lines = lines[page_index * lines_per_page : (page_index + 1) * lines_per_page]
        for row, text in enumerate(page_lines, start=1):
            y = top - (row - 1) * line_height
            if text.startswith("一") or text.startswith("二") or text.startswith("三") or text.startswith("四") or text.startswith("五") or text.startswith("六") or text.startswith("七") or text.startswith("八") or text.startswith("九") or text.startswith("十"):
                pdf.setFont(bold_font, 11)
            else:
                pdf.setFont(regular_font, 10.5)
            pdf.drawString(left, y, text)
        pdf.showPage()
    pdf.save()


def redact_screenshot(image_path: Path) -> Path:
    REDACTED_SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = REDACTED_SCREENSHOT_DIR / image_path.name
    image = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(image)
    width, height = image.size

    if image_path.name == "01-login.png":
        # Hide the demo account field. Password is already blank in the screenshot.
        draw.rounded_rectangle((520, 456, 920, 516), radius=10, fill=(247, 250, 255), outline=(196, 210, 230), width=2)
        draw.text((650, 477), "账号信息已脱敏", fill=(80, 98, 124))
    else:
        # Hide storage path, local IP, public address and access details in the sidebar.
        draw.rounded_rectangle((38, 136, 320, 552), radius=18, fill=(250, 252, 255), outline=(198, 216, 238), width=2)
        draw.text((98, 306), "路径和访问地址已脱敏", fill=(68, 88, 120))
        # Hide the current-folder upload target if it contains runtime-only path details.
        draw.rounded_rectangle((975, 30, min(width - 36, 1068), 88), radius=10, fill=(255, 255, 255))

    image.save(output_path, "PNG")
    return output_path


def draw_wrapped_lines(pdf: canvas.Canvas, lines: list[str], x: float, y: float, font: str, size: float, line_height: float) -> float:
    pdf.setFont(font, size)
    current_y = y
    for line in lines:
        for part in wrap(line, width=48, break_long_words=False, replace_whitespace=False):
            pdf.drawString(x, current_y, part)
            current_y -= line_height
    return current_y


def write_screenshot_page(
    pdf: canvas.Canvas,
    item: tuple[str, str, list[str]],
    page_no: int,
    total_pages: int,
    regular_font: str,
    bold_font: str,
) -> None:
    filename, title, descriptions = item
    image_path = SCREENSHOT_DIR / filename
    draw_header_footer(pdf, "文档鉴别材料", page_no, total_pages, regular_font, bold_font)

    pdf.setFont(bold_font, 13)
    pdf.drawString(56, 786, title)
    y = draw_wrapped_lines(pdf, descriptions, 56, 760, regular_font, 10.5, 17)

    if image_path.exists():
        redacted = redact_screenshot(image_path)
        image = Image.open(redacted)
        image_width, image_height = image.size
        max_width = 500
        max_height = 390
        scale = min(max_width / image_width, max_height / image_height)
        draw_width = image_width * scale
        draw_height = image_height * scale
        x = (A4[0] - draw_width) / 2
        image_y = max(178, y - draw_height - 18)
        pdf.drawImage(ImageReader(str(redacted)), x, image_y, width=draw_width, height=draw_height, preserveAspectRatio=True)
        y = image_y - 22
    else:
        pdf.setFont(regular_font, 10.5)
        pdf.drawString(56, y - 24, "截图文件尚未生成，请先运行截图采集脚本。")
        y -= 46

    pdf.setFont(regular_font, 9.5)
    pdf.drawString(56, max(70, y), "说明：本页为软件界面展示页，涉及运行路径、访问地址、账号等信息已做脱敏处理。")
    pdf.showPage()


def write_illustrated_manual_pdf(output_path: Path, regular_font: str, bold_font: str) -> None:
    lines = manual_lines()
    lines_per_page = 32
    text_pages = (len(lines) + lines_per_page - 1) // lines_per_page
    total_pages = text_pages + len(SCREENSHOT_ITEMS)
    pdf = canvas.Canvas(str(output_path), pagesize=A4)
    width, height = A4
    left = 56
    top = height - 62
    line_height = 21

    for page_index in range(text_pages):
        draw_header_footer(pdf, "文档鉴别材料", page_index + 1, total_pages, regular_font, bold_font)
        page_lines = lines[page_index * lines_per_page : (page_index + 1) * lines_per_page]
        for row, text in enumerate(page_lines, start=1):
            y = top - (row - 1) * line_height
            if text.startswith("一") or text.startswith("二") or text.startswith("三") or text.startswith("四") or text.startswith("五") or text.startswith("六") or text.startswith("七") or text.startswith("八") or text.startswith("九") or text.startswith("十"):
                pdf.setFont(bold_font, 11)
            else:
                pdf.setFont(regular_font, 10.5)
            pdf.drawString(left, y, text)
        pdf.showPage()

    for index, item in enumerate(SCREENSHOT_ITEMS, start=1):
        write_screenshot_page(pdf, item, text_pages + index, total_pages, regular_font, bold_font)

    pdf.save()


def split_text_to_lines(text: str, width: int = 42) -> list[str]:
    return wrap(text, width=width, break_long_words=False, replace_whitespace=False) or [text]


def draw_feature_text_block(
    pdf: canvas.Canvas,
    section: dict,
    x: float,
    y: float,
    regular_font: str,
    bold_font: str,
) -> float:
    pdf.setFont(bold_font, 13)
    pdf.drawString(x, y, section["title"])
    y -= 26

    fields = [
        ("功能用途", section["purpose"]),
        ("操作入口", section["entry"]),
    ]
    for label, value in fields:
        pdf.setFont(bold_font, 10.5)
        pdf.drawString(x, y, f"{label}：")
        pdf.setFont(regular_font, 10.5)
        y = draw_wrapped_lines(pdf, split_text_to_lines(value, 43), x + 58, y, regular_font, 10.5, 16)
        y -= 2

    pdf.setFont(bold_font, 10.5)
    pdf.drawString(x, y, "操作步骤：")
    y -= 18
    pdf.setFont(regular_font, 10.2)
    for index, step in enumerate(section["steps"], start=1):
        for line_index, part in enumerate(split_text_to_lines(step, 44)):
            prefix = f"{index}. " if line_index == 0 else "   "
            pdf.drawString(x + 10, y, f"{prefix}{part}")
            y -= 15
    y -= 2

    fields = [
        ("执行结果", section["result"]),
        ("异常处理", section["exception"]),
    ]
    for label, value in fields:
        pdf.setFont(bold_font, 10.5)
        pdf.drawString(x, y, f"{label}：")
        pdf.setFont(regular_font, 10.5)
        y = draw_wrapped_lines(pdf, split_text_to_lines(value, 43), x + 58, y, regular_font, 10.5, 16)
        y -= 2
    return y


def draw_embedded_screenshot(
    pdf: canvas.Canvas,
    image_name: str,
    caption: str,
    x: float,
    y: float,
    max_width: float,
    max_height: float,
    regular_font: str,
    bold_font: str,
) -> float:
    image_path = SCREENSHOT_DIR / image_name
    if not image_path.exists():
        pdf.setFont(regular_font, 10.5)
        pdf.drawString(x, y, f"{caption}：截图文件尚未生成。")
        return y - 22

    redacted = redact_screenshot(image_path)
    image = Image.open(redacted)
    image_width, image_height = image.size
    scale = min(max_width / image_width, max_height / image_height)
    draw_width = image_width * scale
    draw_height = image_height * scale
    image_x = x + (max_width - draw_width) / 2
    image_y = y - draw_height
    pdf.drawImage(ImageReader(str(redacted)), image_x, image_y, width=draw_width, height=draw_height, preserveAspectRatio=True)
    pdf.setFont(bold_font, 9.8)
    pdf.drawCentredString(x + max_width / 2, image_y - 15, caption)
    pdf.setFont(regular_font, 9)
    pdf.drawCentredString(x + max_width / 2, image_y - 30, "截图中涉及运行路径、访问地址、账号等信息已做脱敏处理。")
    return image_y - 44


def write_interleaved_manual_pdf(output_path: Path, regular_font: str, bold_font: str) -> None:
    intro_lines = [
        f"{SOFTWARE_NAME}{VERSION}用户操作说明书",
        "本文档为软件著作权登记文档鉴别材料，采用图文穿插方式说明软件功能、操作流程和运行效果。",
        "文档中的界面截图来自临时演示环境，账号、路径、访问地址等信息均已脱敏处理，不包含真实个人资料。",
        "软件定位为 AI 驱动的个人云端资料库，主要用于文件存储、目录管理、在线预览、搜索检索和 AI 智能问答。",
        "用户通过浏览器访问系统，无需单独安装客户端程序；服务器端基于 Node.js 运行。",
        "系统支持本机访问、局域网访问和配置后的公网访问，适合个人资料在多终端之间集中管理。",
        "AI 能力用于辅助资料定位、内容摘要、重点提取、单文件分析和结果卡片推荐。",
        "安全方面，系统通过登录会话、用户目录隔离、路径校验、下载令牌和文件夹密码保护用户资料。",
        "本文档所列功能与 DPSir智能云网盘软件 V1.0 版本相对应。",
        "以下章节按照用户实际操作顺序展开，每个章节包含功能用途、入口、步骤、结果、异常处理和界面截图。",
    ]
    function_intro = [
        "十二、功能模块明细",
        "为保证文档覆盖完整，以下对软件主要功能模块进行逐项说明。",
        "每个模块均包含功能目标、入口位置、执行结果、注意事项和通用处理流程。",
        "功能模块既包括可见的前端操作，也包括服务端权限校验、路径保护、错误处理和运行维护能力。",
    ]

    lines_per_page = 32
    detail_lines: list[str] = []
    detail_lines.extend(function_intro)
    for index, (module, purpose, entry, result, caution) in enumerate(DETAILED_MODULES, start=1):
        detail_lines.append(f"{index}. {module}")
        detail_lines.append(f"功能目标：{purpose}。")
        detail_lines.append(f"操作入口：{entry}。")
        detail_lines.append(f"执行结果：{result}。")
        detail_lines.append(f"注意事项：{caution}。")
        detail_lines.append("处理流程：用户触发操作后，系统校验账号、路径、权限和参数，校验通过后执行处理并刷新界面。")
        detail_lines.append("异常处理：输入为空、权限不足、密码错误、文件不存在或网络异常时，系统显示中文提示并停止危险操作。")
    detail_pages = [detail_lines[index : index + lines_per_page] for index in range(0, len(detail_lines), lines_per_page)]
    total_pages = 1 + len(INTERLEAVED_SECTIONS) + len(detail_pages)

    pdf = canvas.Canvas(str(output_path), pagesize=A4)
    width, height = A4

    draw_header_footer(pdf, "文档鉴别材料", 1, total_pages, regular_font, bold_font)
    y = 780
    for index, line in enumerate(intro_lines):
        pdf.setFont(bold_font if index == 0 else regular_font, 13 if index == 0 else 10.8)
        for part in split_text_to_lines(line, 42):
            pdf.drawString(56, y, part)
            y -= 22 if index == 0 else 18
        if index == 0:
            y -= 10
    pdf.showPage()

    for page_offset, section in enumerate(INTERLEAVED_SECTIONS, start=2):
        draw_header_footer(pdf, "文档鉴别材料", page_offset, total_pages, regular_font, bold_font)
        y = draw_feature_text_block(pdf, section, 56, 780, regular_font, bold_font)
        available_height = max(250, y - 88)
        draw_embedded_screenshot(pdf, section["image"], section["caption"], 56, y - 10, width - 112, min(360, available_height), regular_font, bold_font)
        pdf.showPage()

    start_page = 1 + len(INTERLEAVED_SECTIONS) + 1
    for page_index, page_lines in enumerate(detail_pages, start=start_page):
        draw_header_footer(pdf, "文档鉴别材料", page_index, total_pages, regular_font, bold_font)
        y = 780
        for line in page_lines:
            is_heading = line.startswith("十二、") or any(line.startswith(f"{number}. ") for number in range(1, 60))
            pdf.setFont(bold_font if is_heading else regular_font, 11 if is_heading else 10.4)
            for part in split_text_to_lines(line, 45):
                pdf.drawString(56, y, part)
                y -= 20 if is_heading else 18
        pdf.showPage()

    pdf.save()


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    regular_font, bold_font = register_fonts()
    write_source_pdf(OUTPUT_DIR / "DPSir智能云网盘软件_程序鉴别材料_一般交存.pdf", regular_font, bold_font)
    write_full_source_pdf(OUTPUT_DIR / "DPSir智能云网盘软件_完整源代码版_程序鉴别材料.pdf", regular_font, bold_font)
    write_manual_pdf(OUTPUT_DIR / "DPSir智能云网盘软件_用户操作说明书_文档鉴别材料.pdf", regular_font, bold_font)
    write_illustrated_manual_pdf(OUTPUT_DIR / "DPSir智能云网盘软件_用户操作说明书_图文混合版_文档鉴别材料.pdf", regular_font, bold_font)
    write_interleaved_manual_pdf(OUTPUT_DIR / "DPSir智能云网盘软件_用户操作说明书_图文穿插版_文档鉴别材料.pdf", regular_font, bold_font)


if __name__ == "__main__":
    main()
