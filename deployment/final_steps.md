أريدك أن تكمل معي من حيث توقفت في نشر وتحديث مشروع ERP على VPS باستخدام Docker Compose، وتعامل مع هذه الرسالة كملخص الحالة الحالية النهائي والمرجع الأساسي.

مهم جدًا:

- امشِ معي خطوة واحدة فقط في كل مرة.
- بعد كل خطوة، انتظر مني النتيجة أو الخطأ.
- لا تعطيني عدة خطوات مرة واحدة.
- أعطني الأوامر جاهزة للنسخ واللصق.
- اشرح الهدف من كل خطوة باختصار.
- لو ظهر خطأ، شخصه أولًا قبل الانتقال.
- لا تطلب مني إرسال أي passwords أو secrets داخل الشات.
- عندما نحتاج أي secret، استخدم placeholders أو اطلب مني تعديله محليًا فقط.
- لو طلبت منك ملف مرجعي أو Runbook أو Checklist، اكتبه بشكل قوي ومفصل وبشرح عملي واضح، وليس مجرد قائمة سطحية.

هذه هي الحالة الحالية بدقة:

## معلومات السيرفر

- VPS IP: `187.124.169.98`
- الاتصال: `ssh root@187.124.169.98`
- النظام: Ubuntu 24.04.4 LTS
- المعمارية: x86_64
- Docker مثبت ويعمل
- Docker Compose مثبت ويعمل
- Docker service: active + enabled

## مسار المشروع على السيرفر

- مجلد النشر: `/opt/erp`

## مكونات المشروع

- frontend
- backend
- postgres
- redis
- caddy reverse proxy

## الدومين

- الدومين الأساسي: `alhussan.tech`
- `www.alhussan.tech` يعمل redirect إلى `https://alhussan.tech/`
- SSL يعمل عبر Caddy

## Repos

### Backend

- `git@github.com:AhmedAbdelal57/AL-Hussan-Trading-backend-v1.git`

### Frontend

- `git@github.com:AhmedAbdelal57/AL-Hussan-Trading-fronted-v1.git`

## الحالة الحالية للتشغيل

النظام شغال حاليًا بنجاح:

- `https://alhussan.tech/` يرجع 200
- `https://alhussan.tech/api/v1/health` يرجع 200
- تسجيل الدخول نجح
- frontend شغال
- backend شغال
- postgres شغال
- redis شغال
- caddy شغال

## أسماء الحاويات الحالية

- `erp-backend`
- `erp-frontend`
- `erp-postgres`
- `erp-redis`
- `erp-caddy`

## أسماء خدمات docker compose

- `postgres`
- `redis`
- `backend`
- `frontend`
- `caddy`

## ملاحظات مهمة جدًا عن أسلوب العمل بيننا

أنا أريدك أن تتعامل معي بنفس النظام الذي كنا نعمل به:

- خطوة واحدة فقط كل مرة
- تنتظر نتيجتي
- لا تقفز لعدة حلول مرة واحدة
- تشخص الخطأ أولًا
- لا تغيّر أشياء تنظيمية أو تجميلية بلا داعٍ
- نركز على أقل تغيير ممكن يحقق الهدف
- إذا كان النظام شغال، لا نفتح شغل إضافي يعرّضه للمشاكل

## ما تم اكتشافه وحسمه أثناء العمل

### 1) Docker Compose الفعلي

ملف الـ compose الفعلي هو:

- `/opt/erp/docker-compose.yml`

### 2) Restart policy

كل الخدمات عليها:

- `restart: unless-stopped`

وتأكدنا أيضًا أن:

- `systemctl is-enabled docker` = `enabled`

وهذا يعني أن المشروع متوقع أن يعود تلقائيًا بعد reboot أو restart عادي، طالما لم أقم أنا يدويًا بعمل `docker compose down` أو `docker stop`.

### 3) Prisma / Production DB rule

في production لا نستخدم:

- `prisma migrate dev`

ولا نستخدم:

- `npm run prisma:migrate` إذا كان يشغّل migrate dev

المسار الصحيح على production هو:

- `docker compose run --rm backend npm run db:deploy`

والـ backend تم تحديث `package.json` فيه ليحتوي على scripts آمنة للإنتاج:

- `prisma:generate`
- `prisma:migrate:deploy`
- `db:deploy`

### 4) تشغيل أوامر Prisma

السيرفر نفسه لا يحتوي `npm` على الـ host system، لذلك أي أوامر backend أو Prisma نحتاجها يتم تشغيلها من داخل Docker، مثل:

- `cd /opt/erp && docker compose run --rm backend npm run db:deploy`

### 5) مشكلة صلاحيات logs/uploads

ظهرت معنا مشكلة صلاحيات فعلية عند تشغيل backend مؤقتًا:

- `EACCES: permission denied, mkdir 'logs/errors/'`

وتم حلها بهذا الأمر:

- `chown -R 1000:1000 /opt/erp/backend/logs /opt/erp/backend/uploads`

إذا ظهرت مشاكل مشابهة في المستقبل، تذكّر هذه النقطة أولًا.

### 6) uploads / logs

المفروض `uploads` و `logs` لا يكونوا tracked في Git.
وكانت هناك ملفات `uploads` جاية من dev وتسبب تعارضات.
عملنا cleanup صحيح مع backup خارج المشروع.

النسخ الاحتياطية موجودة في:

- `/opt/erp-backups/uploads-backup-...`
- `/opt/erp-backups/logs-backup-...`

والوضع الحالي داخل المشروع:

- `uploads` داخل `/opt/erp/backend/uploads` نظيف حاليًا وفيه فقط `.gitkeep` وقت الفحص
- وتمت إعادة إنشاء `logs` و `uploads` وضبط صلاحياتها

### 7) مشكلة git pull في backend

حدث سابقًا فشل في `git pull` بسبب:

- `Dockerfile`
- `docker-entrypoint.sh`
- وملفات داخل `uploads`

وتعاملنا معها بحذر:

- فحصنا `git status --short`
- فحصنا `git diff`
- قارنا مع `origin/main`
- ثم رجّعنا الملفات غير المهمة فقط
- ثم أكملنا `git pull`

### 8) مشكلة git pull في frontend

حدث سابقًا فشل في `git pull` للـ frontend بسبب:

- `nginx/nginx.conf` untracked

وقارناه مع نسخة GitHub، واتضح أن الفرق غير وظيفي، ثم حذفناه وأكملنا السحب بنجاح.

### 9) آخر تحديث تم بنجاح

تم تنفيذ الآتي بنجاح:

- pull للـ backend
- pull للـ frontend
- تشغيل DB deploy من Docker
- rebuild للـ backend
- rebuild للـ frontend
- التحقق من health والواجهة واللوجات

### 10) نتيجة DB deploy الأخيرة

آخر مرة شغلنا:

- `cd /opt/erp && docker compose run --rm backend npm run db:deploy`

والنتيجة كانت:

- `No pending migrations to apply.`

### 11) آخر ملاحظة في اللوجات

بعد آخر تحديث، backend logs كانت سليمة عمومًا، لكن ظهر 404 على صورة profile قديمة بصيغة `.jpeg` ثم تم رفع صورة جديدة `.jpg`.
هذه كانت ملاحظة تشغيلية وليست crash.

## الوصول الآمن إلى PostgreSQL من اللابتوب

أنا أريد الوصول للـ PostgreSQL بشكل آمن فقط عبر SSH tunnel وليس بفتح البورت للعالم.

### IP الداخلي لحاوية postgres

- `172.18.0.2`

### أمر SSH tunnel من اللابتوب

- `ssh -N -L 5433:172.18.0.2:5432 root@187.124.169.98`

### إعدادات pgAdmin

- Name: `ERP Production`
- Host: `127.0.0.1`
- Port: `5433`
- Maintenance DB: `erp_db`
- Username: `postgres`
- Password: أكتبه محليًا فقط

### مهم

- لا نقوم بفتح PostgreSQL public
- لا نستخدم expose أو publish للبورت 5432 للعالم

## ما أريده منك في هذا الشات الجديد

أريدك أن تكمل معي من هذه النقطة حسب الحاجة:

- Deploy updates جديدة
- تشخيص أخطاء deploy
- التعامل مع git pull conflicts
- تحديث backend أو frontend أو Prisma
- كتابة Runbook/Checklist/Reference قوي عند الطلب
- المساعدة في خطوات آمنة خاصة بالإنتاج

## أسلوب الرد المطلوب

- خطوة واحدة فقط كل مرة
- أمر واحد أو مجموعة أوامر للخطوة الحالية فقط
- شرح الهدف من الخطوة باختصار
- ثم تنتظر نتيجتي
- لا تطلب secrets في الشات
- لا تعطني حلول كثيرة مرة واحدة
- لو هناك أكثر من احتمال للخطأ، ابدأ بأقوى احتمال عملي
