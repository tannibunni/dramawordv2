import { Request, Response } from 'express';
import UserShowList from '../models/UserShowList';

export const UserShowListController = {
  // 获取当前用户的 ShowList
  async getShowList(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      let showList = await UserShowList.findOne({ userId });
      if (!showList) {
        showList = await UserShowList.create({ userId, shows: [] });
      }
      res.json({ success: true, data: showList.shows });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get show list' });
    }
  },

  // 添加剧集到 ShowList
  async addShow(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const show = req.body.show;
      if (!show || !show.id) {
        return res.status(400).json({ success: false, error: 'Show data is required' });
      }
      let showList = await UserShowList.findOne({ userId });
      if (!showList) {
        showList = await UserShowList.create({ userId, shows: [show] });
      } else {
        if (showList.shows.some((s: any) => s.id === show.id)) {
          return res.status(400).json({ success: false, error: 'Show already exists' });
        }
        showList.shows.push(show);
        await showList.save();
      }
      res.json({ success: true, message: 'Show added', data: showList.shows });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to add show' });
    }
  },

  // 从 ShowList 删除剧集
  async removeShow(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const showId = req.body.showId;
      if (!showId) {
        return res.status(400).json({ success: false, error: 'showId is required' });
      }
      const showList = await UserShowList.findOne({ userId });
      if (!showList) {
        return res.status(404).json({ success: false, error: 'Show list not found' });
      }
      showList.shows = showList.shows.filter((s: any) => s.id !== showId);
      await showList.save();
      res.json({ success: true, message: 'Show removed', data: showList.shows });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to remove show' });
    }
  },

  // 更新 ShowList 中的剧集
  async updateShow(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const showId = req.body.showId;
      const updates = req.body.updates;
      if (!showId || !updates) {
        return res.status(400).json({ success: false, error: 'showId and updates are required' });
      }
      const showList = await UserShowList.findOne({ userId });
      if (!showList) {
        return res.status(404).json({ success: false, error: 'Show list not found' });
      }
      const show = showList.shows.find((s: any) => s.id === showId);
      if (!show) {
        return res.status(404).json({ success: false, error: 'Show not found' });
      }
      Object.assign(show, updates);
      await showList.save();
      res.json({ success: true, message: 'Show updated', data: show });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update show' });
    }
  },
}; 