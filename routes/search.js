const SMARTBOX_SEARCH_TYPES = new Set([0, 8, 9, 12]);

function mapSmartboxItem(type, item) {
  switch (type) {
    case 0:
      return {
        album: {
          mid: item.album?.mid || '',
          name: item.album?.name || '',
        },
        docid: item.docid,
        id: item.id,
        mid: item.mid,
        name: item.name,
        singer: (item.singer || '')
          .split(/[|/]/)
          .filter(Boolean)
          .map((name) => ({name})),
      };
    case 8:
      return {
        docid: item.docid,
        id: item.id,
        mid: item.mid,
        name: item.name,
        pic: item.pic,
        singername: item.singer,
      };
    case 9:
      return {
        docid: item.docid,
        id: item.id,
        mid: item.mid,
        name: item.name,
        pic: item.pic,
      };
    case 12:
      return {
        docid: item.docid,
        id: item.id,
        mid: item.mid,
        name: item.name,
        singer: item.singer,
        vid: item.vid,
      };
    default:
      return item;
  }
}

function buildSmartboxResponse(result, {key, pageNo, pageSize, t, typeMap}) {
  const sectionMap = {
    0: 'song',
    8: 'album',
    9: 'singer',
    12: 'mv',
  };
  const sectionKey = sectionMap[t];
  const section = result?.data?.[sectionKey];
  const itemlist = Array.isArray(section?.itemlist) ? section.itemlist : [];

  return {
    result: 100,
    data: {
      list: itemlist.map((item) => mapSmartboxItem(Number(t), item)),
      pageNo: Number(pageNo),
      pageSize: itemlist.length,
      total: Number(section?.count || itemlist.length || 0),
      key,
      t,
      type: typeMap[t],
    },
  };
}

module.exports = {
  // 搜索
  '/': async ({req, res, request, cache}) => {
    let {
      pageNo = 1,
      pageSize = 20,
      key,
      t = 0, // 0：单曲，2：歌单，7：歌词，8：专辑，9：歌手，12：mv
      raw,
    } = req.query;
    let total = 0;

    if (!key) {
      return res.send({
        result: 500,
        errMsg: '关键词不能为空',
      });
    }

    const cacheKey = `search_${key}_${pageNo}_${pageSize}_${t}`;
    const cacheData = cache.get(cacheKey);
    if (cacheData) {
      res && res.send(cacheData);
      return cacheData;
    }
    const typeMap = {
      0: 'song',
      2: 'songlist',
      7: 'lyric',
      8: 'album',
      12: 'mv',
      9: 'singer',
    };

    if (!typeMap[t]) {
      return res.send({
        result: 500,
        errMsg: '搜索类型错误，检查一下参数 t',
      });
    }

    const numericType = Number(t);
    let result;

    if (SMARTBOX_SEARCH_TYPES.has(numericType)) {
      result = await request(
        `https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?key=${encodeURIComponent(key)}&g_tk=5381`,
      );
    } else {
      const url =
        {
          2: `https://c.y.qq.com/soso/fcgi-bin/client_music_search_songlist?remoteplace=txt.yqq.playlist&page_no=${
            pageNo - 1
          }&num_per_page=${pageSize}&query=${key}`,
        }[t] || 'http://c.y.qq.com/soso/fcgi-bin/client_search_cp';

      let data = {
        format: 'json',
        n: pageSize,
        p: pageNo,
        w: key,
        cr: 1,
        g_tk: 5381,
        t,
      };

      if (numericType === 2) {
        data = {
          query: key,
          page_no: pageNo - 1,
          num_per_page: pageSize,
        };
      }

      result = await request({
        url,
        method: 'get',
        data,
        headers: {
          Referer: 'https://y.qq.com',
        },
      });
    }

    if (Number(raw)) {
      return res.send(result);
    }

    if (!result) {
      return;
    }

    if (SMARTBOX_SEARCH_TYPES.has(numericType)) {
      const resData = buildSmartboxResponse(result, {
        key,
        pageNo,
        pageSize,
        t,
        typeMap,
      });
      cache.set(cacheKey, resData, 120);
      res.send(resData);
      return resData;
    }

    if (!result.data) {
      return res.send({
        result: 400,
        errMsg: '搜索接口暂时不可用',
      });
    }

    // 下面是数据格式的美化
    const {keyword} = result.data;
    const keyMap = {
      0: 'song',
      2: '',
      7: 'lyric',
      8: 'album',
      12: 'mv',
      9: 'singer',
    };
    const searchResult =
      (keyMap[t] ? result.data[keyMap[t]] : result.data) || [];
    const {
      list,
      curpage,
      curnum,
      totalnum,
      page_no,
      num_per_page,
      display_num,
    } = searchResult;

    switch (Number(t)) {
      case 2:
        pageNo = page_no + 1;
        pageSize = num_per_page;
        total = display_num;
        break;
      default:
        pageNo = curpage;
        pageSize = curnum;
        total = totalnum;
        break;
    }

    const resData = {
      result: 100,
      data: {
        list,
        pageNo,
        pageSize,
        total,
        key: keyword || key,
        t,
        type: typeMap[t],
      },
      // header: req.header(),
      // req: JSON.parse(JSON.stringify(req)),
    };
    cache.set(cacheKey, resData, 120);
    res.send && res.send(resData);
    return resData;
  },

  // 热搜词
  '/hot': async ({req, res, request}) => {
    const {raw} = req.query;
    const result = await request({
      url: 'https://c.y.qq.com/splcloud/fcgi-bin/gethotkey.fcg',
    });
    if (Number(raw)) {
      return res.send(result);
    }
    res.send({
      result: 100,
      data: result.data.hotkey,
    });
  },

  // 快速搜索
  '/quick': async ({req, res, request}) => {
    const {raw, key} = req.query;
    if (!key) {
      return res.send({
        result: 500,
        errMsg: 'key ?',
      });
    }
    const result = await request(
      `https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?key=${key}&g_tk=5381`,
    );
    if (Number(raw)) {
      return res.send(result);
    }
    return res.send({
      result: 100,
      data: result.data,
    });
  },
};
