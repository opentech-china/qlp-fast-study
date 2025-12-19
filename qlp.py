import json
import random
import time
import requests
url = "https://qlpoa.whut.edu.cn/mp-api/auth/user/viewArticle"

headers = {"accept":"application/json, text/plain, */*",
           "accept-language":"zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,en-GB;q=0.6",
            "authorization":"你的cookie"}


url = "https://qlpoa.whut.edu.cn/mp-api/auth/user/viewArticle?viewType=2&articleId="

# url_lst = "https://qlpoa.whut.edu.cn/mp-api/auth/user/getArticleList?pageNum=1&pageSize=100&mpId=&title=&tag=&level=&orderType=0&isView=&type=&taskType=1,2,3"

with open("article.json", "r", encoding="utf-8") as f:
    article_lst = json.loads(f.read()).get("rows")

id_lst = []
for article in article_lst:
    id_lst.append(article["id"])
print(id_lst)

for id,content in enumerate(id_lst):
    print(id)
    resp = requests.get(url+str(content), headers=headers)
    print(resp.text)
    print()
    print()
    time.sleep(round(random.uniform(0.7, 1.5), 1))