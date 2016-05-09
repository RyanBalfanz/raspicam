import base64
import io
import os
import time

import picamera
from celery import Celery

FIREBASE_APP_URL = os.getenv('FIREBASE_APP_URL', 'https://raspberrypi3.firebaseio.com')
IMAGE_FORMAT = 'jpeg'

app = Celery('tasks', broker='redis://')
app.config_from_object('celeryconfig')

@app.task(bind=True)
def capture_from_camera(self):
	warmUpSeconds = 2
	resolution = (1024, 768)
	with io.BytesIO() as buf:
		with picamera.PiCamera() as camera:
			camera.resolution = resolution
			camera.start_preview()
			time.sleep(warmUpSeconds)  # Warm-up the camera.
			camera.capture(buf, IMAGE_FORMAT)
		byteString = buf.getvalue()
		return base64.b64encode(byteString).decode()

@app.task(bind=True)
def post_to_firebase(self, imgData):
	from firebase import firebase
	firebase = firebase.FirebaseApplication(FIREBASE_APP_URL, None)

	data_url = "data:image/{};base64,{}".format(IMAGE_FORMAT, imgData)
	payload = {"data": data_url}
	result = firebase.post('/snaps', payload)
	return result

@app.task(bind=True)
def capture_and_upload_workflow(self):
	return (capture_from_camera.s() | post_to_firebase.s())()
