import asyncio
import re
import os
import argparse
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from pyppeteer import launch, errors
from pyppeteer.page import Page


class GovSpiderConfig:
    """政府网站爬虫配置类"""
    BASE_URL = "https://sousuo.www.gov.cn/sousuo/search.shtml"
    SEARCH_PARAMS = {
        "code": "17da70961a7",
        "dataTypeId": "107",
        "searchWord": "国务院办公厅关于{}年部分节假日安排的通知"
    }
    SELECTORS = {
        "result_container": ".basic_result_content>.item",
        "result_item": ".basic_result_content>.item.is-news",
        "title_link": "a.title",
        "content_container": ".pages_content"
    }
    REQUEST_HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36"
    }
    TIMEOUTS = {
        "page_load": 60000,
        "element_wait": 30000,
        "content_load": 15000
    }

class GovHolidaySpider:
    """国务院节假日安排爬虫"""

    def __init__(self, debug: bool = True):
        self.debug = debug
        self.config = GovSpiderConfig()
        self.crawler = HolidayCrawler(debug)

    async def _log(self, message: str, icon: str = "🔍"):
        """记录日志"""
        if self.debug:
            timestamp = datetime.now().strftime("%H:%M:%S")
            print(f"{icon} [{timestamp}] {message}")

    async def _init_browser(self):
        """初始化浏览器实例"""
        await self._log("启动无头浏览器...", "🚀")
        return await launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox']
        )

    async def _process_search_page(self, page: Page, year: int) -> List[Dict]:
        """处理搜索结果页面"""
        search_word = self.config.SEARCH_PARAMS["searchWord"].format(year)
        url_params = {
            "code": self.config.SEARCH_PARAMS["code"],
            "dataTypeId": self.config.SEARCH_PARAMS["dataTypeId"],
            "searchWord": search_word
        }
        search_url = f"{self.config.BASE_URL}?{'&'.join(f'{k}={v}' for k,v in url_params.items())}"

        await self._log(f"搜索 {year}年节假日安排 → {search_url}", "🌐")
        try:
            response = await page.goto(search_url, {
                'waitUntil': 'networkidle2',
                'timeout': self.config.TIMEOUTS["page_load"]
            })
            if not response.ok:
                await self._log(f"页面加载失败 HTTP {response.status}", "❌")
                return []
        except errors.NetworkError as e:
            await self._log(f"网络错误: {str(e)}", "⚠️")
            return []
        except errors.TimeoutError:
            await self._log("页面加载超时", "⏳")
            return []

        return await self._parse_search_results(page, year)

    async def _parse_search_results(self, page: Page, year: int) -> List[Dict]:
        """解析搜索结果"""
        await self._log("等待结果加载...", "⏳")
        try:
            await page.waitForSelector(
                self.config.SELECTORS["result_container"],
                {'timeout': self.config.TIMEOUTS["element_wait"]}
            )
        except errors.TimeoutError:
            await self._log("结果加载超时", "⏳")
            return []

        items = await page.querySelectorAll(self.config.SELECTORS["result_item"])
        await self._log(f"发现 {len(items)} 条搜索结果", "📊")

        results = []
        for idx, item in enumerate(items, 1):
            result = await self._process_result_item(item, page, year, idx)
            if result:
                results.append(result)
        return results

    async def _process_result_item(self, item, page: Page, year: int, idx: int) -> Optional[Dict]:
        """处理单个搜索结果项"""
        await self._log(f"解析第 {idx} 条结果", "📄")

        try:
            title_element = await item.querySelector(self.config.SELECTORS["title_link"])
            if not title_element:
                await self._log("标题元素缺失", "⚠️")
                return None

            title = await page.evaluate('(e) => e.textContent.trim()', title_element)
            link = await page.evaluate('(e) => e.href', title_element)

            content = await self._fetch_detail_content(link)
            parsed_data = self.crawler.parse(content, year)

            return {
                'year': year,
                'title': title,
                'link': link,
                'content': content,
                'parsed_data': parsed_data['holidays'],
                'publish_date': parsed_data['metadata']['publish_date']
            }
        except Exception as e:
            await self._log(f"处理失败: {str(e)}", "❌")
            return None

    async def _fetch_detail_content(self, url: str) -> str:
        """获取详情页内容"""
        await self._log(f"访问详情页 → {url}", "🔗")
        detail_page = await self.browser.newPage()

        try:
            await detail_page.setUserAgent(self.config.REQUEST_HEADERS["User-Agent"])
            await detail_page.goto(url, {
                'waitUntil': 'domcontentloaded',
                'timeout': self.config.TIMEOUTS["page_load"]
            })

            try:
                await detail_page.waitForSelector(
                    self.config.SELECTORS["content_container"],
                    {'timeout': self.config.TIMEOUTS["content_load"]}
                )
            except errors.TimeoutError:
                await self._log("内容加载超时", "⏳")

            return await detail_page.evaluate('''() => {
                const el = document.querySelector('.pages_content');
                return el ? el.innerText.trim() : 'CONTENT_NOT_FOUND';
            }''')
        except errors.NetworkError:
            return 'NETWORK_ERROR'
        finally:
            await detail_page.close()

    async def run(self, years: List[int]) -> Dict[int, List[Dict]]:
        """执行爬虫任务"""
        self.browser = await self._init_browser()
        results = {}

        try:
            for year in years:
                page = await self.browser.newPage()
                await page.setUserAgent(self.config.REQUEST_HEADERS["User-Agent"])
                year_results = await self._process_search_page(page, year)
                results[year] = year_results
                await page.close()
        finally:
            await self.browser.close()

        return results

class HolidayCrawler:
    """节假日通知解析器"""

    def __init__(self, debug: bool = True):
        self.debug = debug

    def _log(self, message: str, icon: str = "🐛"):
        """调试日志"""
        if self.debug:
            timestamp = datetime.now().strftime("%H:%M:%S")
            print(f"{icon} [{timestamp}] {message}")

    def parse(self, text: str, year: int) -> dict:
        """解析年度通知核心内容"""
        self._log(f"开始解析 {year}年节假日通知", "🔍")
        result = {}

        # 假日正则表达式
        holiday_pattern = re.compile(
            r'([一二三四五六七八九十]+)、\s*'       # 匹配序号
            r'([^：:\n]+?)\s*'                     # 匹配节日名称部分
            r'[：:]\s*'                            # 匹配分隔符
            r'((?:.(?!\n[一二三四五六七八九十]+、))*.)',  # 匹配内容(使用否定前瞻)
            re.DOTALL
        )

        # 日期范围正则，支持年份和简写格式
        date_range_pattern = re.compile(
            r'((?:\d{4}年)?\d{1,2}月\d{1,2}日)\D*至\D*'  # 开始日期
            r'((?:\d{4}年)?(?:\d{1,2}月\d{1,2}日|\d{1,2}日))'  # 结束日期
        )

        # 补班日期匹配模式（支持多个日期分隔）
        workday_pattern = re.compile(
            r'((?:\d{1,2}月\d{1,2}日\s*(?:（[^）]*）)?\s*[,、]?\s*)+)上班'  # 匹配连续日期
        )

        # 遍历所有节假日条目
        for match in holiday_pattern.finditer(text):
            self._log(f"发现第{match.group(1)}条节假日条目", "📌")
            _, name_part, content = match.groups()

            # 处理多节日情况(支持中文顿号、和)
            names = re.split(r'[、和]', name_part.strip())
            self._log(f"原始节日名称: {name_part} → 拆分结果: {names}", "✨")

            # 解析日期范围
            date_range = date_range_pattern.search(content)
            holiday_data = {}
            date_list = []

            # 处理日期范围
            if date_range:
                self._log(f"找到日期范围: {date_range.group()}", "📅")
                start_str, end_str = date_range.groups()

                start_date = self._parse_date(start_str, year)
                self._log(f"解析开始日期: {start_str} → {start_date}", "⏱️" if start_date else "⚠️")

                end_date = self._parse_end_date(end_str, start_date, year)
                self._log(f"解析结束日期: {end_str} → {end_date}", "⏱️" if end_date else "⚠️")

                if start_date and end_date:
                    # 处理跨年逻辑
                    if end_date < start_date:
                        self._log("检测到跨年日期，自动修正年份", "🔄")
                        end_date = end_date.replace(year=end_date.year + 1)
                    date_list = self._generate_date_range(start_date, end_date)
                    self._log(f"生成日期范围: {len(date_list)}天 ({date_list[0]} ~ {date_list[-1]})", "📆")
                    holiday_data['dates'] = date_list
            else:
                self._log("未找到日期范围，尝试匹配单日期", "🔎")
                # 处理单日期
                single_date_pattern = re.compile(r'(\d{1,2}月\d{1,2}日)[^至]*$')
                single_date = single_date_pattern.search(content)
                if single_date:
                    start_date = self._parse_date(single_date.group(1), year)
                    if start_date:
                        # 处理跨年单日期（如12月31日跨年）
                        if start_date.year != year:
                            start_date = start_date.replace(year=year)
                        date_list = [start_date]
                        holiday_data['dates'] = date_list

            # 提取补班日期（精确匹配）
            work_days = []
            if date_match := workday_pattern.search(content):
                self._log(f"找到补班日期: {date_match.group(1)}", "👔")
                date_strings = re.findall(r'\d{1,2}月\d{1,2}日', date_match.group(1))
                for date_str in date_strings:
                    parsed_date = self._parse_date(date_str, year)
                    status_icon = "✅" if parsed_date else "❌"
                    self._log(f"解析补班日期: {date_str} → {parsed_date}", status_icon)
                    if parsed_date:
                        work_days.append(parsed_date)

            # 过滤无效补班日期
            if work_days:
                valid_work_days = []
                date_range_start = date_list[0] if date_list else None
                date_range_end = date_list[-1] if date_list else None

                for wd in work_days:
                    # 排除在放假日期范围内的补班日期
                    if date_range_start and date_range_end:
                        if not (date_range_start <= wd <= date_range_end):
                            valid_work_days.append(wd)
                    else:
                        valid_work_days.append(wd)
                self._log(f"过滤后有效补班日期: {len(valid_work_days)}个", "🛡️")
                holiday_data['work_days'] = valid_work_days

            # 合并结果
            for name in names:
                name = name.strip()
                if not name:
                    continue

                # 自动补全常见节日名称
                original_name = name
                if '节' not in name:
                    if name in ['元旦', '劳动', '国庆']:
                        name += '节'
                    elif name in ['清明', '端午', '中秋']:
                        name += '节'
                if original_name != name:
                    self._log(f"自动补全节日名称: {original_name} → {name}", "🏷️")
                result[name] = holiday_data.copy()

        # 独立检查日期范围相同的节日，并进行合并
        self._log("开始合并相同日期的节日", "🔄")
        date_to_names = {}  # 用于存储日期范围对应的节日名称
        for name, info in result.items():
            dates = tuple(info.get('dates', []))  # 将日期列表转换为元组
            if dates not in date_to_names:
                date_to_names[dates] = []
            date_to_names[dates].append(name)

        # 合并日期范围相同的节日
        final_result = {
            'holidays': {},  # 独立存储节假日信息
            'metadata': {}   # 存储元数据
        }
        for dates, names in date_to_names.items():
            if len(names) > 1:
                # 如果有多个节日日期范围相同，合并为一个条目
                combined_name = '、'.join(names)
                self._log(f"合并相同日期节日: {names} → {combined_name}", "✨")
                final_result['holidays'][combined_name] = result[names[0]]
            else:
                # 否则直接添加到最终结果
                final_result['holidays'][names[0]] = result[names[0]]

        # 元数据解析
        publish_date = self._parse_publish_date(text)
        if publish_date:
            final_result['metadata']['publish_date'] = publish_date
            self._log(f"解析到发文日期: {publish_date.strftime('%Y-%m-%d')}", "📝")

        self._log(f"解析完成，共找到{len(final_result['holidays'])}个节假日", "🎉")
        return final_result

    def _parse_date(self, date_str: str, year: int) -> datetime:
        """清洗并转换日期字符串，支持跨年日期"""
        try:
            clean_date = re.sub(r'[（(].*?[)）]', '', date_str).strip()
            match = re.match(r'(?:(\d{4})年)?(\d{1,2})月(\d{1,2})日', clean_date)
            if not match:
                return None
            y, m, d = match.groups()
            # 如果日期中包含年份，则使用该年份；否则使用传入的默认年份
            year = int(y) if y else year
            month = m.zfill(2)
            day = d.zfill(2)
            return datetime.strptime(f"{year}-{month}-{day}", "%Y-%m-%d")
        except Exception as e:
            self._log(f"日期解析失败: {date_str} - {str(e)}")
            return None

    def _parse_end_date(self, end_str: str, start_date: datetime, default_year: int) -> datetime:
        """解析可能简写的结束日期"""
        # 尝试完整解析
        parsed = self._parse_date(end_str, default_year)
        if parsed:
            return parsed

        # 处理仅日情况（如"27日"）
        day_match = re.match(r'(\d{1,2})日', end_str)
        if day_match and start_date:
            try:
                day = int(day_match.group(1))
                # 处理跨月情况
                parsed = start_date.replace(day=day)
                if parsed < start_date:
                    # 如果结束日期小于开始日期，则认为是跨月
                    next_month = start_date.replace(day=28) + timedelta(days=4)  # 跳到下个月
                    parsed = next_month.replace(day=day)
                return parsed
            except Exception as e:
                self._log(f"结束日期解析失败 {end_str}: {e}")
        return None

    def _generate_date_range(self, start: datetime, end: datetime) -> list:
        """生成连续日期序列"""
        return [start + timedelta(days=x) for x in range((end - start).days + 1)]

    # 发文日期解析方法
    def _parse_publish_date(self, text: str) -> datetime:
        """解析发文日期"""
        publish_date_pattern = re.compile(
            r'国务院办公厅\s*'          # 匹配发文机构
            r'(\d{4}年\d{1,2}月\d{1,2}日)',  # 捕获发文日期
            re.MULTILINE
        )

        if match := publish_date_pattern.search(text):
            return self._parse_date(match.group(1), datetime.now().year)
        return None


async def main(args):
    """主运行函数"""
    spider = GovHolidaySpider(debug=not args.quiet)

    # 显示启动横幅
    if not args.quiet:
        print("\n" + "="*40)
        print("🎯 国务院节假日安排抓取工具".center(38))
        print("="*40)
        print(f"📅 目标年份: {', '.join(map(str, args.years))}")
        print(f"📂 输出目录: {os.path.abspath(args.output)}")
        print("="*40 + "\n")

    # 执行爬取
    results = await spider.run(args.years)

    # 保存结果
    os.makedirs(args.output, exist_ok=True)
    for year, data in results.items():
        filename = f"holidays_{year}.json"
        save_path = os.path.join(args.output, filename)
        with open(save_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)

    return results

def parse_args():
    """解析命令行参数"""

    parser = argparse.ArgumentParser(
        description="国务院节假日安排抓取工具",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    parser.add_argument('-o', '--output',
                        default='output',
                        help='输出文件目录')
    parser.add_argument('-y', '--years',
                        nargs='+',
                        type=int,
                        required=not ('ipykernel' in sys.modules),
                        help='要抓取的年份列表（空格分隔）')
    parser.add_argument('-q', '--quiet',
                        action='store_true',
                        help='静默模式')
    return parser.parse_args()

if __name__ == "__main__":
    # Windows系统需要设置事件循环策略
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    args = parse_args()

    # 验证年份有效性
    if args:
        current_year = datetime.now().year
        for y in args.years:
            if not (2000 <= y <= current_year + 2):
                print(f"⚠️  无效年份: {y} (仅支持2000-{current_year + 2}年)")
                exit(1)

    # 运行主程序
    asyncio.run(main(args if args else None))