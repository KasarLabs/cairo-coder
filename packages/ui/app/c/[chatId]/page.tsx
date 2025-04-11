import ChatWindow from '@/components/ChatWindow';

export type paramsType = Promise<{ chatId: string }>;

const Page = async ({ params }: { params: paramsType }) => {
  const { chatId } = await params;
  return <ChatWindow id={chatId} />;
};

export default Page;
