from setuptools import setup, find_packages

setup(
    name="cymatics",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        'fastapi',
        'uvicorn',
        'sqlalchemy',
        'pygame',
        'numpy',
        'opencv-python',
        'python-dotenv',
    ]
)