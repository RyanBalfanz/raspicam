from datetime import timedelta


CELERYBEAT_SCHEDULE = {
	'capture-and-upload-every-30-seconds': {
		'task': 'tasks.capture_and_upload_workflow',
		'schedule': timedelta(seconds=120),
	},
}

CELERY_TIMEZONE = 'UTC'
