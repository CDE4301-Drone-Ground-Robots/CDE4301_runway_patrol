from setuptools import find_packages, setup
import os
from glob import glob

package_name = 'runway_navigation'

setup(
    name=package_name,
    version='0.0.1',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages', ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        (os.path.join('share', package_name, 'launch'), glob('launch/*.py')),
        (os.path.join('share', package_name, 'config'), glob('config/*.yaml')),
        (os.path.join('share', package_name, 'maps'), glob('maps/*')),
        (os.path.join('share', package_name, 'rviz'), glob('rviz/*')),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='Hilbert Soh',
    maintainer_email='hilbertsoh@gmail.com',
    description='Nav2 autonomous navigation for Runway UGV',
    license='Apache-2.0',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'uav_waypoint_commander = runway_navigation.uav_waypoint_commander:main',
            'ugv_c2_bridge_node = runway_navigation.ugv_c2_bridge_node:main',
        ],
    },
)