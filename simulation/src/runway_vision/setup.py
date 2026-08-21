from setuptools import find_packages, setup

package_name = 'runway_vision'

setup(
    name=package_name,
    version='0.0.1',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='Hilbert Soh',
    maintainer_email='hilbertsoh@gmail.com',
    description='YOLO Computer Vision node for Runway FOD Inspection',
    license='Apache-2.0',
    extras_require={
        'test': [
            'pytest',
        ],
    },
    entry_points={
        'console_scripts': [
            'fod_detector = runway_vision.fod_detector_node:main',
        ],
    },
)