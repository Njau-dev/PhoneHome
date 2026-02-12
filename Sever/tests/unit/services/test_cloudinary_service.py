import importlib
import logging
import cloudinary


class FakeFile:
    def __init__(self, filename):
        self.filename = filename



def _load_cloudinary_module(app):
    with app.app_context():
        module = importlib.import_module("app.services.cloudinary_service")
        return importlib.reload(module)



def test_upload_image_success_maps_secure_url(app, monkeypatch):
    module = _load_cloudinary_module(app)
    monkeypatch.setattr(module, "ALLOWED_EXTENSIONS", {"jpg", "png"})

    monkeypatch.setattr(
        module.cloudinary.uploader,
        "upload",
        lambda file: {"secure_url": "https://cdn.example.com/image.jpg"},
    )

    success, result = module.CloudinaryService.upload_image(FakeFile("phone.jpg"))

    assert success is True
    assert result == "https://cdn.example.com/image.jpg"



def test_upload_image_cloudinary_error_mapping_and_log(app, monkeypatch, caplog):
    module = _load_cloudinary_module(app)
    monkeypatch.setattr(module, "ALLOWED_EXTENSIONS", {"jpg"})

    def raise_cloudinary_error(_file):
        raise cloudinary.exceptions.Error("upstream 5xx")

    monkeypatch.setattr(module.cloudinary.uploader, "upload", raise_cloudinary_error)

    with caplog.at_level(logging.ERROR):
        success, result = module.CloudinaryService.upload_image(FakeFile("phone.jpg"))

    assert success is False
    assert "Cloudinary error: upstream 5xx" == result
    assert "Cloudinary upload failed" in caplog.text



def test_upload_image_invalid_extension_uses_allowed_extension_message(app, monkeypatch):
    module = _load_cloudinary_module(app)
    monkeypatch.setattr(module, "ALLOWED_EXTENSIONS", {"png"})

    success, result = module.CloudinaryService.upload_image(FakeFile("phone.exe"))

    assert success is False
    assert "Invalid file type. Allowed: png" == result



def test_upload_images_partial_success_logs_warning(app, monkeypatch, caplog):
    module = _load_cloudinary_module(app)

    files = [FakeFile("one.jpg"), FakeFile("two.jpg")]

    outcomes = iter([(True, "https://cdn.example.com/one.jpg"), (False, "Upload failed")])
    monkeypatch.setattr(module.CloudinaryService, "upload_image", lambda _file: next(outcomes))

    with caplog.at_level(logging.WARNING):
        success, result = module.CloudinaryService.upload_images(files)

    assert success is True
    assert result == ["https://cdn.example.com/one.jpg"]
    assert "Some uploads failed" in caplog.text



def test_delete_image_success_and_failure_paths(app, monkeypatch):
    module = _load_cloudinary_module(app)

    monkeypatch.setattr(module.cloudinary.uploader, "destroy", lambda _public_id: {"result": "ok"})
    assert module.CloudinaryService.delete_image("img-1") is True

    monkeypatch.setattr(module.cloudinary.uploader, "destroy", lambda _public_id: {"result": "not found"})
    assert module.CloudinaryService.delete_image("img-2") is False
