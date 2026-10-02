import cv2, time, os, sys
from PIL import Image
sr = cv2.dnn_superres.DnnSuperResImpl_create()
sr.readModel("C:/Users/HP/AppData/Local/Temp/sr/EDSR_x2.pb" if os.path.exists("C:/Users/HP/AppData/Local/Temp/sr/EDSR_x2.pb") else "/tmp/sr/EDSR_x2.pb")
sr.setModel("edsr", 2)
t=time.time()
img = cv2.imread("C:/Users/HP/AppData/Local/Temp/claude/c--Documents-OeilOrg/547ae1cb-19d4-404c-99c3-a94a3ea5258a/images/63.jpg")
# test on a crop first to time it
crop = img[300:560, 200:520]
out = sr.upsample(crop)
print("crop", crop.shape, "->", out.shape, round(time.time()-t,1), "s")
cv2.imwrite("C:/Users/HP/AppData/Local/Temp/claude/c--Documents-OeilOrg/547ae1cb-19d4-404c-99c3-a94a3ea5258a/scratchpad/shots/sr-test.png", out)
cv2.imwrite("C:/Users/HP/AppData/Local/Temp/claude/c--Documents-OeilOrg/547ae1cb-19d4-404c-99c3-a94a3ea5258a/scratchpad/shots/sr-base.png", cv2.resize(crop,None,fx=2,fy=2,interpolation=cv2.INTER_LANCZOS4))
