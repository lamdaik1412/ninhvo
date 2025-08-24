export function registerPoemStory(bot, { state, utils, content }) {
  bot.command("poem", (ctx) => {
    const n = utils.getNick(state, ctx.chat.id);
    const poems = content.poems(n);
    ctx.reply(utils.bagPick(state, ctx, "poems", poems));
  });

  bot.command("story", (ctx) => {
    const n = utils.getNick(state, ctx.chat.id);
    const stories = content.stories(n);
    ctx.reply(utils.bagPick(state, ctx, "stories", stories));
  });
}
