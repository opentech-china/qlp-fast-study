// 文章数据
var articleJson = [];
// 存储ticket
let globalTicket = '';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // articleJson = await fetch("article260123.json").then(res => res.json());
        articleJson = await fetch("https://opentech-china.github.io/qlp-fast-study/article260123.json").then(res => res.json()); // 更保险！
    } catch (e) {
        console.error('加载文章数据失败:', e);
        alert('加载文章数据失败，请检查文件是否存在');
    }

    const articleListBody = document.getElementById('articleListBody');
    const startBtn = document.getElementById('startBtn');
    const authorizationInput = document.getElementById('authorization');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const resultTableBody = document.getElementById('resultTableBody');
    const getAuthBtn = document.getElementById('getAuthBtn');
    const qrcodeModal = document.getElementById('qrcodeModal');
    const qrcodeImg = document.getElementById('qrcodeImg');
    const loadTokenBtn = document.getElementById('loadTokenBtn');
    const closeModalBtn = document.querySelector('.close-modal');

    // 提取文章ID和标题并展示
    if (articleJson && articleJson.rows) {
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
    }

    if (localStorage.getItem("Temp_Authorization") != null) {
        authorizationInput.value = localStorage.getItem("Temp_Authorization");
    }

    // 自动获取authorization按钮点击事件
    getAuthBtn.addEventListener('click', async () => {
        try {
            // 立即显示模态框（先展示loading）
            qrcodeModal.style.display = 'flex';
            // 重置状态：显示loading，隐藏二维码
            document.getElementById('qrcodeLoading').classList.remove('hidden');
            qrcodeImg.classList.add('hidden');

            // 第一步：获取ticket
            const qrCodeResponse = await fetch("https://qlpoa.whut.edu.cn/mp-api/public/mp/login/getQrCode");
            const qrCodeData = await qrCodeResponse.json();

            if (qrCodeData.code === 200 && qrCodeData.data && qrCodeData.data.ticket) {
                globalTicket = qrCodeData.data.ticket;

                // 第二步：获取二维码图片
                const qrcodeUrl = `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(globalTicket)}`;

                // 监听图片加载完成事件
                qrcodeImg.onload = function () {
                    // 加载完成：隐藏loading，显示二维码
                    document.getElementById('qrcodeLoading').classList.add('hidden');
                    qrcodeImg.classList.remove('hidden');
                };
                // 图片加载失败处理
                qrcodeImg.onerror = function () {
                    document.getElementById('qrcodeLoading').innerHTML = '<span style="color: #dc3545;">二维码加载失败，请重试</span>';
                };
                // 设置图片地址
                qrcodeImg.src = qrcodeUrl;

            } else {
                // 获取ticket失败，更新loading提示
                document.getElementById('qrcodeLoading').innerHTML = `<span style="color: #dc3545;">获取二维码失败：${qrCodeData.msg || '未知错误'}</span>`;
            }
        } catch (error) {
            console.error('获取二维码出错:', error);
            // 异常处理，更新loading提示
            document.getElementById('qrcodeLoading').innerHTML = `<span style="color: #dc3545;">获取二维码出错：${error.message}</span>`;
            // 确保模态框仍显示（方便用户看到错误信息）
            qrcodeModal.style.display = 'flex';
        }
    });

    // 加载token按钮点击事件
    loadTokenBtn.addEventListener('click', async () => {
        if (!globalTicket) {
            alert('ticket不存在，请重新获取二维码');
            return;
        }

        try {
            loadTokenBtn.disabled = true;
            loadTokenBtn.textContent = '查询中...';

            // 请求获取用户信息和token
            const userInfoResponse = await fetch(`https://qlpoa.whut.edu.cn/mp-api/public/mp/login/getQrCodeUserInfo?ticket=${encodeURIComponent(globalTicket)}`);
            const userInfoData = await userInfoResponse.json();

            if (userInfoData.code === 500) {
                alert('查询失败：可能二维码已过期或未扫码登录');
            } else if (userInfoData.code === 200 && userInfoData.msg === '操作成功' && userInfoData.data) {
                // 显示学生姓名
                const studentName = userInfoData.data.studentName || '获取用户出现严重错误！';
                alert(`成功，欢迎 ${studentName}，已经更新Authorization Token`);

                // 填充token到输入框
                if (userInfoData.data.token) {
                    authorizationInput.value = userInfoData.data.token;
                    localStorage.setItem("Temp_Authorization", userInfoData.data.token);

                    // 关闭模态框
                    qrcodeModal.style.display = 'none';
                } else {
                    alert('获取到用户信息，但未找到token');
                }
            } else {
                alert('获取token失败：' + (userInfoData.msg || '未知错误'));
            }
        } catch (error) {
            console.error('获取token出错:', error);
            alert('获取token出错：' + error.message);
        } finally {
            loadTokenBtn.disabled = false;
            loadTokenBtn.textContent = '加载token';
        }
    });

    // 关闭模态框
    closeModalBtn.addEventListener('click', () => {
        qrcodeModal.style.display = 'none';
        globalTicket = '';
    });

    // 点击模态框背景关闭
    qrcodeModal.addEventListener('click', (e) => {
        if (e.target === qrcodeModal) {
            qrcodeModal.style.display = 'none';
            globalTicket = '';
        }
    });

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
        const articleLst = articleJson?.rows || [];
        const idLst = articleLst.map(article => article.id);
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

                // 计算随机延迟时间 (0.3-0.7秒)
                const delay = Math.round(Math.random() * 400 + 300); // 修正延迟时间范围

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