FROM node:18-alpine

# ��������Ŀ¼
WORKDIR /usr/src/app

# ����package�ļ�
COPY package*.json ./

# ��װ����
RUN npm install --production

# ����Դ����
COPY . .

# ���û�������
ENV PORT=3000
ENV NODE_ENV=production

# ��¶�˿�
EXPOSE 3000

# ��������
CMD ["node", "server.js"] 