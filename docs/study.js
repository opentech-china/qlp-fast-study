// 文章数据
var articleJson = [];

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    articleJson = await fetch("article251222.json").then(res => res.json());
    const articleListBody = document.getElementById('articleListBody');
    const startBtn = document.getElementById('startBtn');
    const authorizationInput = document.getElementById('authorization');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const resultTableBody = document.getElementById('resultTableBody');

    // 提取文章ID和标题并展示
    const articleLst = articleJson.rows;
    const idLst = articleLst.map(article => article.id);

    // 显示文章列表
    articleLst.forEach((article, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${article.id}</td>
                    <td>${article.title}</td>
                `;
        articleListBody.appendChild(row);
    });

    if (localStorage.getItem("Temp_Authorization") != null) {
        authorizationInput.value = localStorage.getItem("Temp_Authorization");
    }

    // 开始学习按钮点击事件
    startBtn.addEventListener('click', () => {
        const authorization = authorizationInput.value.trim();

        if (!authorization) {
            alert('请输入Authorization令牌');
            return;
        }

        localStorage.setItem("Temp_Authorization", authorization);
        
        // 清空之前的结果
        resultTableBody.innerHTML = '';

        startBtn.disabled = true;
        startBtn.textContent = '学习中...';
        progressFill.style.width = '0%';
        progressText.textContent = '开始学习...';

        // 开始处理文章列表
        processArticles(idLst, 0, authorization, articleLst.length);
    });

    // 处理文章的递归函数
    const processArticles = (ids, index, token, total) => {
        if (index >= ids.length) {
            // 所有文章处理完毕
            progressFill.style.width = '100%';
            progressText.textContent = '所有文章学习完成！';
            startBtn.disabled = false;
            startBtn.textContent = '开始学习';
            return;
        }

        const articleId = ids[index];
        const url = `https://qlpoa.whut.edu.cn/mp-api/auth/user/viewArticle?viewType=2&articleId=${articleId}`;
        const headers = {
            "accept": "application/json, text/plain, */*",
            "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,en-GB;q=0.6",
            "authorization": token
        };

        // 更新进度
        const progress = (((index + 1) / total) * 100).toFixed(1);
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `正在学习第 ${index + 1}/${total} 篇文章 (ID: ${articleId})`;

        // 发送请求
        fetch(url, { headers })
            .then(response => response.json())
            .then(data => {
                // 添加结果到表格（最新数据插入到顶部）
                addResultToTable(index + 1, articleId, data);

                // 计算随机延迟时间 (0.7-1.5秒)
                const delay = Math.round(Math.random() * 800 + 700);

                // 使用setTimeout和箭头函数实现延迟
                setTimeout(() => {
                    processArticles(ids, index + 1, token, total);
                }, delay);
            })
            .catch(error => {
                // 处理错误
                addResultToTable(index + 1, articleId, {
                    code: 500,
                    msg: `请求失败: ${error.message}`,
                    data: null
                });

                // 错误时也继续处理下一篇
                const delay = Math.round(Math.random() * 800 + 700);
                setTimeout(() => {
                    processArticles(ids, index + 1, token, total);
                }, delay);
            });
    };

    // 添加结果到表格（最新数据在顶部）
    const addResultToTable = (index, articleId, result) => {
        const row = document.createElement('tr');

        // 确定状态类和得分
        const statusClass = result.code === 200 && result.msg === '操作成功'
            ? 'status-success'
            : 'status-error';
        const point = result.data && result.data.point !== undefined ? result.data.point : '-';

        row.innerHTML = `
                    <td>${index}</td>
                    <td>${articleId}</td>
                    <td class="${statusClass}">${result.code}</td>
                    <td>${result.msg || '无信息'}</td>
                    <td>${point}</td>
                `;

        // 插入到表格顶部
        resultTableBody.insertBefore(row, resultTableBody.firstChild);

        // 滚动到顶部
        const tableContainer = document.querySelector('.result-section .table-container');
        tableContainer.scrollTop = 0;
    };
});
