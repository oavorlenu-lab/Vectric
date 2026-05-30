import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import postsRouter from "./posts";
import categoriesRouter from "./categories";
import tagsRouter from "./tags";
import mediaRouter from "./media";
import messagesRouter from "./messages";
import newsletterRouter from "./newsletter";
import adsRouter from "./ads";
import settingsRouter from "./settings";
import aiRouter from "./ai";
import usersRouter from "./users";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(postsRouter);
router.use(categoriesRouter);
router.use(tagsRouter);
router.use(mediaRouter);
router.use(messagesRouter);
router.use(newsletterRouter);
router.use(adsRouter);
router.use(settingsRouter);
router.use(aiRouter);
router.use(usersRouter);
router.use(statsRouter);

export default router;
