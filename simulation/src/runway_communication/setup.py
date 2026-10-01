from setuptools import find_packages, setup

package_name = 'runway_communication'

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
    maintainer='oliver',
    maintainer_email='oliver@todo.todo',
    description='Inter-agent C2 Communication & Telemetry Package for Runway Patrol',
    license='Apache-2.0',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'ugv_c2_bridge_node = runway_communication.ugv_c2_bridge_node:main',
            'uav_waypoint_commander = runway_communication.uav_waypoint_commander:main',
            'DemoComs_C2 = runway_communication.DemoComs_C2:main',
        ],
    },
)
