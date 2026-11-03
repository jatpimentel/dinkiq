import os

import cloudinary
from cloudinary_storage.storage import MediaCloudinaryStorage


def _configure():
    cloudinary.config(
        cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
        api_key=os.environ["CLOUDINARY_API_KEY"],
        api_secret=os.environ["CLOUDINARY_API_SECRET"],
        secure=True,
    )


class ConfiguredMediaStorage(MediaCloudinaryStorage):
    def url(self, name):
        _configure()
        return super().url(name)

    def _save(self, name, content):
        _configure()
        return super()._save(name, content)

    def exists(self, name):
        _configure()
        return super().exists(name)